import json
from datetime import datetime, timezone


GEN = 10**18


def _open_round(contract, direct_vm, sender, deadline):
    direct_vm.sender = sender
    direct_vm.value = 2 * GEN
    return contract.open_round(
        "Social hyperbinding replication",
        "Does the locked social hyperbinding effect replicate for face stimuli?",
        "PMC8500892",
        "10.3758/s13423-021-01928-7",
        "sample,outcome,replication",
        deadline,
    )


def test_open_round_enforces_exact_value_and_locks_canonical_fields(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    view = json.loads(contract.get_round(round_id))
    assert view["id"] == "R-1"
    assert view["status"] == "OPEN"
    assert view["remaining_purse_gen"] == "2.00"
    assert view["scope_ids"] == ["outcome", "replication", "sample"]

    direct_vm.value = GEN
    with direct_vm.expect_revert("round requires exactly 2 GEN"):
        contract.open_round("bad", "bad", "PMC1", "10.1/bad", "scope", 1893459600)


def test_duplicate_evidence_and_unauthorized_close_leave_state_unchanged(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    with direct_vm.expect_revert("duplicate evidence in round"):
        contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    with direct_vm.expect_revert("only sponsor"):
        contract.close_round(round_id)
    assert json.loads(contract.get_round(round_id))["status"] == "OPEN"


def test_review_qualified_result_creates_one_gen_credit_and_claim_status(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    direct_vm.mock_web(
        r".*PMCID:PMC8500892.*",
        {"status": 200, "body": "PMC8500892 10.3758/s13423-021-01928-7 original record"},
    )
    direct_vm.mock_web(
        r".*PMCID:PMC13367721.*",
        {"status": 200, "body": "PMC13367721 10.1371/journal.pone.0352510 replication record"},
    )
    direct_vm.mock_llm(
        r".*LOCKED CLAIM.*",
        json.dumps({
            "comparability": "SUFFICIENT",
            "finding": "CORROBORATES",
            "covered_scope_ids": ["outcome", "replication", "sample"],
            "reason": "The bounded record addresses the locked scope.",
        }),
    )
    contract.review_submission(submission_id)
    round_view = json.loads(contract.get_round(round_id))
    submission_view = json.loads(contract.get_submission(submission_id))
    credits = json.loads(contract.get_account_credits(direct_bob))
    assert round_view["claim_status"] == "SUPPORTED"
    assert submission_view["status"] == "QUALIFIED"
    assert len(credits) == 1
    assert credits[0]["amount_gen"] == "1.00"


def test_submission_rejects_exact_deadline_and_preserves_slots(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    deadline = int(datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc).timestamp())
    round_id = _open_round(contract, direct_vm, direct_alice, deadline)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    direct_vm.warp("2030-01-01T00:59:59Z")
    contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    direct_vm.value = 0
    direct_vm.warp("2030-01-01T01:00:00Z")
    with direct_vm.expect_revert("submission deadline passed"):
        contract.submit_replication(round_id, "PMC99999", "10.9999/late")
    assert len(json.loads(contract.get_round(round_id))["submissions"]) == 1


def test_close_at_exact_deadline_refunds_remaining_purse_once(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    deadline = int(datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc).timestamp())
    round_id = _open_round(contract, direct_vm, direct_alice, deadline)
    direct_vm.value = 0
    direct_vm.sender = direct_alice
    direct_vm.warp("2030-01-01T01:00:00Z")
    contract.close_round(round_id)
    view = json.loads(contract.get_round(round_id))
    credits = json.loads(contract.get_account_credits(direct_alice))
    assert view["status"] == "EXPIRED"
    assert view["remaining_purse_gen"] == "0.00"
    assert credits[0]["kind"] == "SPONSOR_REFUND"
    assert credits[0]["amount_gen"] == "2.00"
    with direct_vm.expect_revert("round already closed"):
        contract.close_round(round_id)


def test_active_submission_blocks_expiry_close(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    deadline = int(datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc).timestamp())
    round_id = _open_round(contract, direct_vm, direct_alice, deadline)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    direct_vm.sender = direct_alice
    direct_vm.warp("2030-01-01T01:00:00Z")
    with direct_vm.expect_revert("active submission must be resolved"):
        contract.close_round(round_id)
    assert json.loads(contract.get_round(round_id))["status"] == "OPEN"


def test_unavailable_source_is_retryable_without_value_or_claim_change(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    direct_vm.mock_web(r".*europepmc.*", {"status": 503, "body": ""})
    contract.review_submission(submission_id)
    submission = json.loads(contract.get_submission(submission_id))
    round_view = json.loads(contract.get_round(round_id))
    assert submission["status"] == "RETRYABLE"
    assert round_view["claim_status"] == "UNTESTED"
    assert round_view["remaining_purse_gen"] == "2.00"
    assert json.loads(contract.get_account_credits(direct_bob)) == []
