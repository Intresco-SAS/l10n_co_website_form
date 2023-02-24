# -*- coding: utf-8 -*-
{
    'name': 'Shop Address Enhancement',
    'version': '14.0.1',
    'category': 'eCommerce',
    'depends': [
        'base',
        'l10n_co_res_partner',
        'website_sale',
        "website_sale_suggest_create_account", 
        "web_tour"
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/templates.xml',
    ],
    'application': True,
}