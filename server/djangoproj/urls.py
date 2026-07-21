from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

react_app = TemplateView.as_view(template_name="index.html")
urlpatterns = [
    path("admin/", admin.site.urls),
    path("djangoapp/", include("djangoapp.urls")),
    path("", TemplateView.as_view(template_name="Home.html"), name="home"),
    path("about", TemplateView.as_view(template_name="About.html"), name="about"),
    path("contact", TemplateView.as_view(template_name="Contact.html"), name="contact"),
    path("login", react_app, name="login_page"),
    path("register", react_app, name="register_page"),
    path("dealers", react_app, name="dealers_page"),
    path("dealer/<int:dealer_id>", react_app, name="dealer_page"),
    path("postreview/<int:dealer_id>", react_app, name="post_review_page"),
]
