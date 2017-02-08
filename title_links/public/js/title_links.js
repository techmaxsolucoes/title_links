frappe.ui.form.ControlLink = frappe.ui.form.ControlLink.extend({
	make_input: function(){
		var me = this;
		this._super();
		this.$input.off("focus");
		this.$input.on("focus", function(){
			setTimeout(function(){
				if (me.$input.val() && me.get_options()){
					me.$link.toggle(true);
					me.$link_open.attr("href", [
						"#Form",
						me.get_options(),
						frappe.model.get_value(me.doctype, me.docname, me.df.fieldname)
					].join("/"));
				}
			}, 500);
		});
	},
	format_for_input: function(value){
		var me = this, su = this._super, ret;
		if (me.doctype && me.docname && value) {
			frappe.call({
				'async': false,
				'method': 'title_links.routes.search_title',
				'args': {
					doctype: me.df.options,
					name: value
				},
				callback: function(res){
					if (!res.exc){
						ret = res.message[1];
					}
				}
			});
		} else if (me.value) {
			ret = me.value;
		} else {
			ret = su(value)
		}
		return ret;
	},
	get_value: function(){
		var value = this._super();
		if (this.doctype && this.docname && value){
			return frappe.model.get_value(this.doctype, this.docname, this.df.fieldname);
		} else {
			return value;
		}
	},
	setup_autocomplete: function() {
		var me = this;
		this.$input.on("blur", function() {
			if(me.selected) {
				me.selected = false;
				return;
			}
			var value = me.get_value();
			if(me.doctype && me.docname) {
				if(value!==me.last_value) {
					me.parse_validate_and_set_in_model(value);
					me.set_mandatory(value);
				}
			} else {
				me.set_mandatory(value);
			}
		});

		this.$input.cache = {};
		this.$input.autocomplete({
			minLength: 0,
			autoFocus: true,
			source: function(request, response) {
				var doctype = me.get_options();
				if(!doctype) return;
				if (!me.$input.cache[doctype]) {
					me.$input.cache[doctype] = {};
				}

				if (me.$input.cache[doctype][request.term]!=null) {
					// immediately show from cache
					response(me.$input.cache[doctype][request.term]);
				}

				var args = {
					'txt': request.term,
					'doctype': doctype,
				};

				me.set_custom_query(args);

				return frappe.call({
					type: "GET",
					method:'title_links.routes.search_link',
					no_spinner: true,
					args: args,
					callback: function(r) {
						if(!me.$input.is(":focus")) {
							return;
						}

						if(!me.df.only_select) {
							if(frappe.model.can_create(doctype)
								&& me.df.fieldtype !== "Dynamic Link") {
								// new item
								r.results.push({
									value: "<span class='text-primary link-option'>"
										+ "<i class='icon-plus' style='margin-right: 5px;'></i> "
										+ __("Create a new {0}", [__(me.df.options)])
										+ "</span>",
									action: me.new_doc
								});
							};
							// advanced search
							r.results.push({
								value: "<span class='text-primary link-option'>"
									+ "<i class='icon-search' style='margin-right: 5px;'></i> "
									+ __("Advanced Search")
									+ "</span>",
								action: me.open_advanced_search
							});
						}

						me.$input.cache[doctype][request.term] = r.results;
						response(r.results);
					},
				});
			},
			open: function(event, ui) {
				me.$wrapper.css({"z-index": 101});
				me.autocomplete_open = true;
			},
			close: function(event, ui) {
				me.$wrapper.css({"z-index": 1});
				me.autocomplete_open = false;
			},
			focus: function( event, ui ) {
				event.preventDefault();
				if(ui.item.action) {
					return false;
				}
			},
			select: function(event, ui) {
				me.autocomplete_open = false;

				// prevent selection on tab
				var TABKEY = 9;
				if(event.keyCode === TABKEY) {
					event.preventDefault();
					me.$input.autocomplete("close");
					return false;
				}

				if(ui.item.action) {
					ui.item.value = "";
					ui.item.action.apply(me);
				}

				// if remember_selected hook is set, add this value
				// to defaults so you do not need to set it again
				// unless it is changed.
				if(frappe.boot.remember_selected && frappe.boot.remember_selected.indexOf(me.df.options)!==-1) {
					frappe.boot.user.defaults[me.df.options] = ui.item.value;
				}
				if(me.frm && me.frm.doc) {
					me.selected = true;
					me.parse_validate_and_set_in_model(ui.item.value);
					me.set_mandatory(ui.item.value);
					setTimeout(function() {
						me.selected = false;
					}, 100);
				} else {
					me.$input.val(ui.item.value).trigger('change');
					me.set_mandatory(ui.item.value);
				}
			}
		})
		.on("blur", function() {
			$(this).autocomplete("close");
		})
		.data('ui-autocomplete')._renderItem = function(ul, d) {
			var html = "<strong>" + __(d.title || d.value) + "</strong>";
			if(d.description && d.value!==d.description) {
				html += '<br><span class="small">' + __(d.description) + '</span>';
			}
			return $('<li></li>')
				.data('item.autocomplete', d)
				.html('<a><p>' + html + '</p></a>')
				.appendTo(ul);
		};
		// remove accessibility span (for now)
		this.$wrapper.find(".ui-helper-hidden-accessible").remove();
	}
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
		if (df.fieldtype.indexOf("Link") !== -1){
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