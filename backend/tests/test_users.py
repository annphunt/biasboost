"""Tests for POST /api/users."""
import pytest
from .conftest import make_user


def test_create_user_success(client):
    r = client.post("/api/users", json={"userId": 100})
    assert r.status_code == 201
    assert r.json() == {"userId": 100}


def test_create_user_idempotent(client):
    """Creating the same user twice is fine (INSERT OR IGNORE)."""
    client.post("/api/users", json={"userId": 101})
    r = client.post("/api/users", json={"userId": 101})
    assert r.status_code == 201


def test_create_user_invalid_zero(client):
    r = client.post("/api/users", json={"userId": 0})
    assert r.status_code == 400


def test_create_user_invalid_negative(client):
    r = client.post("/api/users", json={"userId": -5})
    assert r.status_code == 400


def test_create_user_invalid_string(client):
    r = client.post("/api/users", json={"userId": "abc"})
    assert r.status_code == 400


def test_create_user_missing_field(client):
    r = client.post("/api/users", json={})
    assert r.status_code == 400
