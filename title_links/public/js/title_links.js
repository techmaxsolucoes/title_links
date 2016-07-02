frappe.ui.form.ControlLink = frappe.ui.form.ControlLink.extend({
	format_for_input: function(value){
		var me = this, su = this._super;
		if (this.selected){
			return this.selected_title;
		} else {
			var ret;
			frappe.call({
				'async': false,
				'method': 'title_links.routes.search_title',
				'args': {
					doctype: me.df.options,
					name: value
				},
				'callback': function(res){
					if (!res.exc){
						me.selected_title = res.message[1];
						ret = res.message[1];
					}
				}
			});
			return ret;
		}
	},
	get_value: function(){
		if (this.doctype && this.docname){
			return frappe.model.get_value(this.doctype, this.docname, this.df.fieldname);
		} else {
			return this._super();
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
					method:'frappe.desk.search.search_link',
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
					me.selected_title = ui.item.title || ui.item.value;
					me.parse_validate_and_set_in_model(ui.item.value);
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
