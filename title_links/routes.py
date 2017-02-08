# -*- coding: utf-8 -*-
# Copyright (c) 2015, SAN Brasil S/A and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import cstr, unique

@frappe.whitelist()
def search_link(doctype, txt, query=None, filters=None, page_len=20, searchfield=None):
	search_widget(doctype, txt, query, searchfield=searchfield, page_len=page_len, filters=filters)
	frappe.response['results'] = build_for_autosuggest(frappe.response['values'])
	del frappe.response['values']

@frappe.whitelist()
def search_title(doctype, name):
	meta = frappe.get_meta(doctype)
	if meta.title_field:
		return name, frappe.db.get_value(doctype, name, meta.title_field or 'name'), meta.title_field
	else:
		return name, name, meta.title_field

@frappe.whitelist()
def search_widget(doctype, txt, query=None, searchfield=None, start=0,
	page_len=10, filters=None, as_dict=False):
	if isinstance(filters, basestring):
		import json
		filters = json.loads(filters)

	meta = frappe.get_meta(doctype)

	if not searchfield:
		searchfield = "name"

	standard_queries = frappe.get_hooks().standard_queries or {}

	if query and query.split()[0].lower()!="select":
		# by method
		frappe.response["values"] = frappe.call(query, doctype, txt,
			searchfield, start, page_len, filters, as_dict=as_dict)
	elif not query and doctype in standard_queries:
		# from standard queries
		search_widget(doctype, txt, standard_queries[doctype][0],
			searchfield, start, page_len, filters)
	else:
		if query:
			frappe.throw("This query style is discontinued")
			# custom query
			# frappe.response["values"] = frappe.db.sql(scrub_custom_query(query, searchfield, txt))
		else:
			if isinstance(filters, dict):
				filters_items = filters.items()
				filters = []
				for f in filters_items:
					if isinstance(f[1], (list, tuple)):
						filters.append([doctype, f[0], f[1][0], f[1][1]])
					else:
						filters.append([doctype, f[0], "=", f[1]])

			if filters==None:
				filters = []
			or_filters = []

			if meta.title_field:
				title_field = meta.title_field
			else:
				title_field = None

			# build from doctype
			if txt:
				search_fields = ["name"]

				if meta.search_fields:
					search_fields.extend(meta.get_search_fields())

				if title_field and title_field not in search_fields:
					search_fields.append(title_field)

				for f in search_fields:
					fmeta = meta.get_field(f.strip())
					if f == "name" or (fmeta and fmeta.fieldtype in ["Data", "Text", "Small Text", "Long Text",
						"Link", "Select", "Read Only", "Text Editor"]):
							or_filters.append([doctype, f.strip(), "like", "%{0}%".format(txt)])

			if meta.get("fields", {"fieldname":"enabled", "fieldtype":"Check"}):
				filters.append([doctype, "enabled", "=", 1])
			if meta.get("fields", {"fieldname":"disabled", "fieldtype":"Check"}):
				filters.append([doctype, "disabled", "!=", 1])


			fields = get_std_fields_list(meta, searchfield or "name")
			if title_field:
				fields.insert(0, "name")
				fields.append("{} as `title`".format(frappe.db.escape(title_field)))
			else:
				fields.append("NULL as `title`")

			# find relevance as location of search term from the beginning of string `name`. used for sorting results.
			fields.append("""locate("{_txt}", `tab{doctype}`.`name`) as `_relevance`""".format(
				_txt=frappe.db.escape((txt or "").replace("%", "")), doctype=frappe.db.escape(doctype)))

			values = frappe.get_list(doctype,
				filters=filters, fields=fields,
				or_filters = or_filters, limit_start = start,
				limit_page_length=page_len,
				order_by="if(_relevance, _relevance, 99999), idx desc, modified desc".format(doctype),
				ignore_permissions = True if doctype == "DocType" else False, # for dynamic links
				as_list=not as_dict)

			# remove _relevance from results
			frappe.response["values"] = [r[:-1] for r in values]


def get_std_fields_list(meta, key):
	# get additional search fields
	sflist = meta.search_fields and meta.search_fields.split(",") or []
	if meta.title_field and meta.title_field in sflist:
		sflist.remove(meta.title_field)
	title_field = [meta.title_field] if meta.title_field else []
	sflist = ['name'] + sflist + title_field
	if not key in sflist:
		sflist = sflist + [key]

	return ['`tab%s`.`%s`' % (meta.name, f.strip()) for f in sflist]


def build_for_autosuggest(res):
	results = []
	for r in res:
		out = {'value': r[0],
			   "description": ",".join(unique(cstr(d) for d in r)[1:-1]),
			   "title": r[-1]}
		results.append(out)
	return results


def scrub_custom_query(query, key, txt):
	if '%(key)s' in query:
		query = query.replace('%(key)s', key)
	if '%s' in query:
		query = query.replace('%s', ((txt or '') + '%'))
	return query
