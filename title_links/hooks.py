# -*- coding: utf-8 -*-
from __future__ import unicode_literals

app_name = "title_links"
app_title = "Title Links"
app_publisher = "MaxMorais"
app_description = "Links using DocType title instead of name as Description"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "max.morais.dmm@gmail.com"
app_version = "0.0.1"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/title_links/css/title_links.css"
app_include_js = [
	"/assets/title_links/js/title_links.js"
]

# include js, css files in header of web template
# web_include_css = "/assets/title_links/css/title_links.css"
# web_include_js = "/assets/title_links/js/title_links.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "title_links.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "title_links.install.before_install"
# after_install = "title_links.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "title_links.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"title_links.tasks.all"
# 	],
# 	"daily": [
# 		"title_links.tasks.daily"
# 	],
# 	"hourly": [
# 		"title_links.tasks.hourly"
# 	],
# 	"weekly": [
# 		"title_links.tasks.weekly"
# 	]
# 	"monthly": [
# 		"title_links.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "title_links.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
override_whitelisted_methods = {
	"frappe.desk.search.search_link": "title_links.routes.search_link",
	"frappe.desk.search.search_title": "title_links.routes.search_title"
}
