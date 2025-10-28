import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app')))

from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_page(client):
    """Test home page loads"""
    response = client.get('/')
    assert response.status_code == 200

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_get_tasks(client):
    """Test getting tasks"""
    response = client.get('/api/tasks')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_task(client):
    """Test adding a new task"""
    task_data = {
        'title': 'Test Task',
        'description': 'Test Description',
        'priority': 'high',
        'category': 'work'
    }
    response = client.post('/api/tasks', json=task_data)
    assert response.status_code == 201
    assert response.json['title'] == 'Test Task'
