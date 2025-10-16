"""
URL configuration for pythonMS project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path
from .views import run_python, run_algorithm_color, run_algorithm_search, run_algorithm_path, run_algorithm_layoutplanning, health

urlpatterns = [
    path("run/", run_python, name="run_python"),
    path("coloring/", run_algorithm_color, name = "color_graph"),
    path("searching/", run_algorithm_search, name = "search_graph"),
    path("pathfinding/", run_algorithm_path, name = "path_graph"),
    path("layoutplanning/", run_algorithm_layoutplanning, name="layout_planning"),
    path("health/", health, name="health"),
]
