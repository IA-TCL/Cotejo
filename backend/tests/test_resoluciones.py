def _exp_con_diff(client):
    """Crea expediente con un campo diff (RFC)."""
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    exp = res.json()
    campo_rfc = next(c for c in exp["campos"] if c["etiqueta"] == "RFC")
    client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_rfc['id']}",
        json={"valor_usuario": "ROBM850412QX3", "valor_analista": "ROBM850412QX8"},
    )
    return exp, campo_rfc


def test_upsert_resolucion(client):
    exp, campo = _exp_con_diff(client)
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["valor_elegido"] == "usuario"


def test_upsert_resolucion_actualiza(client):
    exp, campo = _exp_con_diff(client)
    client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "analista"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["valor_elegido"] == "analista"


def test_resolucion_en_campo_match_falla(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    exp = res.json()
    campo_match = exp["campos"][0]  # valor_usuario == valor_analista == ""
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo_match['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_decision_rechazar_sin_resolver(client):
    exp, _ = _exp_con_diff(client)
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "rechazado", "nota_decision": "Datos inválidos"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "rechazado"


def test_decision_aprobar_sin_resolver_falla(client):
    exp, _ = _exp_con_diff(client)
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_decision_aprobar_con_todas_resueltas(client):
    exp, campo = _exp_con_diff(client)
    client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "analista"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "aprobado"
    assert res.json()["cerrado_en"] is not None


def test_decision_en_expediente_cerrado_falla(client):
    exp, _ = _exp_con_diff(client)
    client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "rechazado"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 409
