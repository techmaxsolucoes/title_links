frappe.ui.form.ControlLink = frappe.ui.form.ControlLink.extend({
	
});


frappe.form.formatters.Link = function(value, docfield, options) {
	var doctype = docfield._options || docfield.options, title;
	if (value){
		frappe.call({
			'async': false,
			'method': 'title_links.routes.search_title',
			'args': {
				doctype: doctype,
				name: value
			},
			callback: function(res){
				if (!res.exc){
					title = res.message[1];
				}
			}
		});
	}
	if(value && value.match(/^['"].*['"]$/)) {
		return value.replace(/^.(.*).$/, "$1");
	}
	if(options && options.for_print) {
		return title || value;
	}
	if(!value) {
		return "";
	}
	if(docfield && docfield.link_onclick) {
		return repl('<a onclick="%(onclick)s">%(title)s</a>',
			{onclick: docfield.link_onclick.replace(/"/g, '&quot;'), title:title});
	} else if(docfield && doctype) {
		return repl('<a class="grey" href="#Form/%(doctype)s/%(name)s" data-doctype="%(doctype)s">%(label)s</a>', {
			doctype: encodeURIComponent(doctype),
			name: encodeURIComponent(value),
			label: __(options && options.label || title || value)
		});
	} else {
		return title || value;
	}
};

frappe.ui.form.GridRow = frappe.ui.form.GridRow.extend({
	make_column: function(df, colsize, txt, ci){
		var me = this;
		if (this.doc && this.doc.doctype !== cur_frm.doctype && me.doc[df.fieldname] && df.fieldtype.indexOf("Link") !== -1){
			frappe.call({
				'async': false,
				'method': 'title_links.routes.search_title',
				'args': {
					doctype: (df.fieldtype === "Link") ? df.options : me.doc[df.options],
					name: me.doc[df.fieldname]
				},
				callback: function(res){
					if (!res.exc){
						txt = res.message[1];
					}
				}
			});	
		}
		return this._super(df, colsize, txt, ci);
	}
});

(function(){
frappe.templates["list_item_main"] = frappe.templates["list_item_main"].replace(
	'<a class="filterable h6 text-muted grey" data-filter="{%= col.fieldname %},=,{%= value %}">{%= value %}</a>',
	'<a class="filterable h6 text-muted grey" data-filter="{%= col.fieldname %},=,{%= value %}">{%= frappe.format(value, col.df, null, data) %}</a>'
);
delete frappe.template.compiled["list_item_main"];
})();
