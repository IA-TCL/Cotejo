def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_list_empty(client):
    res = client.get("/expedientes")
    assert res.status_code == 200
    assert res.json() == []


def test_create_expediente(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["numero"].startswith("EXP-")
    assert data["solicitante"] == "Ana Torres"
    assert data["analista_nombre"] == "C. Vega"
    assert data["estado"] == "en_revision"
    assert len(data["campos"]) == 14  # 14 campos del seed


def test_create_expediente_sin_analista(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
    )
    assert res.status_code == 400


def test_create_expediente_tipo_invalido(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "tipo_inexistente"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_list_con_expediente(client):
    client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.get("/expedientes")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["solicitante"] == "Ana Torres"
