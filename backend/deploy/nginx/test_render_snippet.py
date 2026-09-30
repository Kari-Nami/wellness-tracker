import unittest
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('render_snippet', Path(__file__).with_name('render-snippet.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
render = module.render


class RoutingTemplateTest(unittest.TestCase):
    def test_subpath_strips_prefix_and_preserves_nginx_variables(self):
        value = render('/sample/app', '18080', '13000')
        self.assertIn('location ^~ /sample/app/api/', value)
        self.assertIn('proxy_pass http://127.0.0.1:13000/api/;', value)
        self.assertIn('proxy_set_header Host $host;', value)
        self.assertIn('proxy_set_header X-Real-IP $remote_addr;', value)

    def test_root_has_no_redirect_loop(self):
        value = render('/', '18080', '13000')
        self.assertNotIn('location = / {', value)
        self.assertIn('location ^~ /api/', value)
        self.assertIn('location ^~ / {', value)

    def test_rejects_configuration_injection(self):
        for value in ['/bad;path', '//bad', '/bad/../path']:
            with self.assertRaises(ValueError):
                render(value, '18080', '13000')
        with self.assertRaises(ValueError):
            render('/', '70000', '13000')


if __name__ == '__main__':
    unittest.main()
