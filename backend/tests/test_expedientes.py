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


def _crear_exp(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    return res.json()


def test_get_expediente(client):
    exp = _crear_exp(client)
    res = client.get(f"/expedientes/{exp['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == exp["id"]
    assert len(data["campos"]) == 14
    assert data["resoluciones"] == []


def test_get_expediente_no_existe(client):
    res = client.get("/expedientes/9999")
    assert res.status_code == 404


def test_patch_campo(client):
    exp = _crear_exp(client)
    campo_id = exp["campos"][0]["id"]  # primer campo

    res = client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_id}",
        json={"valor_usuario": "Ana Torres", "valor_analista": "Ana Torres"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "match"


def test_patch_campo_genera_diff(client):
    exp = _crear_exp(client)
    campo_id = exp["campos"][1]["id"]  # segundo campo (RFC)

    res = client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_id}",
        json={"valor_usuario": "ROBM850412QX3", "valor_analista": "ROBM850412QX8"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "diff"
