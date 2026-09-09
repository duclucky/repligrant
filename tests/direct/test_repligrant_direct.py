import json
from datetime import datetime, timezone


GEN = 10**18


def _source_body(pmcid, doi, abstract="Bounded outcome evidence.", irrelevant=""):
    return json.dumps({
        "resultList": {
            "result": [{
                "pmcid": pmcid,
                "doi": doi,
                "title": "A bounded replication record",
                "irrelevant": irrelevant,
                "abstractText": abstract,
                "pubYear": "2029",
                "publicationStatus": "ppublish",
                "pubTypeList": {"pubType": ["Journal Article"]},
            }],
        },
    })


def _mock_bound_sources(direct_vm):
    direct_vm.mock_web(
        r".*PMCID:PMC8500892.*",
        {"status": 200, "body": _source_body("PMC8500892", "10.3758/s13423-021-01928-7")},
    )
    direct_vm.mock_web(
        r".*PMCID:PMC13367721.*",
        {"status": 200, "body": _source_body("PMC13367721", "10.1371/journal.pone.0352510")},
    )


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
    _mock_bound_sources(direct_vm)
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


def test_unresolved_finding_is_non_paying_and_non_mutating(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    _mock_bound_sources(direct_vm)
    direct_vm.mock_llm(
        r".*LOCKED CLAIM.*",
        json.dumps({
            "comparability": "SUFFICIENT",
            "finding": "UNRESOLVED",
            "covered_scope_ids": ["outcome", "replication", "sample"],
            "reason": "The exact outcome direction cannot be resolved.",
        }),
    )

    contract.review_submission(submission_id)

    submission = json.loads(contract.get_submission(submission_id))
    round_view = json.loads(contract.get_round(round_id))
    assert submission["status"] == "RETRYABLE"
    assert submission["finding"] == "UNRESOLVED"
    assert round_view["claim_status"] == "UNTESTED"
    assert round_view["remaining_purse_gen"] == "2.00"
    assert round_view["remaining_slots"] == 1
    assert json.loads(contract.get_account_credits(direct_bob)) == []


def test_post_deadline_pending_and_retryable_recovery_releases_slots_and_enables_refund(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/repligrant.py")
    deadline = int(datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc).timestamp())
    direct_vm.warp("2030-01-01T00:00:00Z")
    pending_round = _open_round(contract, direct_vm, direct_alice, deadline)
    retryable_round = _open_round(contract, direct_vm, direct_alice, deadline)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    pending_id = contract.submit_replication(pending_round, "PMC13367721", "10.1371/journal.pone.0352510")
    retryable_id = contract.submit_replication(retryable_round, "PMC99991", "10.9999/retryable")
    direct_vm.mock_web(r".*europepmc.*", {"status": 503, "body": ""})
    contract.review_submission(retryable_id)
    assert json.loads(contract.get_submission(retryable_id))["status"] == "RETRYABLE"

    direct_vm.warp("2030-01-01T00:59:59Z")
    with direct_vm.expect_revert("submission deadline has not passed"):
        contract.expire_submission(pending_id)

    direct_vm.warp("2030-01-01T01:00:00Z")
    direct_vm.sender = direct_bob
    contract.expire_submission(pending_id)
    direct_vm.sender = direct_alice
    contract.expire_submission(retryable_id)

    for round_id, submission_id in ((pending_round, pending_id), (retryable_round, retryable_id)):
        submission = json.loads(contract.get_submission(submission_id))
        round_view = json.loads(contract.get_round(round_id))
        assert submission["status"] == "EXPIRED"
        assert round_view["remaining_slots"] == 2
        assert round_view["claim_status"] == "UNTESTED"
        assert round_view["remaining_purse_gen"] == "2.00"
        contract.close_round(round_id)

    refunds = json.loads(contract.get_account_credits(direct_alice))
    assert [credit["amount_gen"] for credit in refunds] == ["2.00", "2.00"]


def test_expiry_recovery_rejects_unrelated_caller_and_duplicate_without_accounting_change(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/repligrant.py")
    deadline = int(datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc).timestamp())
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, deadline)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    direct_vm.warp("2030-01-01T01:00:01Z")
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("only sponsor or contributor"):
        contract.expire_submission(submission_id)
    unchanged = json.loads(contract.get_round(round_id))
    assert unchanged["remaining_purse_gen"] == "2.00"
    assert unchanged["remaining_slots"] == 1

    direct_vm.sender = direct_alice
    contract.expire_submission(submission_id)
    with direct_vm.expect_revert("submission is already terminal"):
        contract.expire_submission(submission_id)
    final_view = json.loads(contract.get_round(round_id))
    assert final_view["remaining_purse_gen"] == "2.00"
    assert final_view["claim_status"] == "UNTESTED"
    assert json.loads(contract.get_account_credits(direct_alice)) == []


def test_not_comparable_terminal_submissions_release_slots_but_remain_in_history(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    first_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    second_id = contract.submit_replication(round_id, "PMC99992", "10.9999/second")
    _mock_bound_sources(direct_vm)
    direct_vm.mock_web(
        r".*PMCID:PMC99992.*",
        {"status": 200, "body": _source_body("PMC99992", "10.9999/second")},
    )
    direct_vm.mock_llm(
        r".*LOCKED CLAIM.*",
        json.dumps({
            "comparability": "NOT_COMPARABLE",
            "finding": "UNRESOLVED",
            "covered_scope_ids": ["outcome", "replication", "sample"],
            "reason": "The study does not measure the locked outcome.",
        }),
    )
    contract.review_submission(first_id)
    contract.review_submission(second_id)
    assert json.loads(contract.get_round(round_id))["remaining_slots"] == 2

    third_id = contract.submit_replication(round_id, "PMC99993", "10.9999/third")
    fourth_id = contract.submit_replication(round_id, "PMC99994", "10.9999/fourth")
    view = json.loads(contract.get_round(round_id))
    history = json.loads(contract.get_round_submissions(round_id))
    assert view["remaining_slots"] == 0
    assert [item["id"] for item in history] == [first_id, second_id, third_id, fourth_id]
    assert history[0]["status"] == "NOT_COMPARABLE"
    assert history[1]["status"] == "NOT_COMPARABLE"


def test_review_parses_exact_europe_pmc_fields_instead_of_truncating_raw_json(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    noise = "x" * 1500
    direct_vm.mock_web(
        r".*PMCID:PMC8500892.*",
        {"status": 200, "body": _source_body("PMC8500892", "10.3758/s13423-021-01928-7", "ORIGINAL_EXACT_SCOPE_TOKEN", noise)},
    )
    direct_vm.mock_web(
        r".*PMCID:PMC13367721.*",
        {"status": 200, "body": _source_body("PMC13367721", "10.1371/journal.pone.0352510", "REPLICATION_EXACT_SCOPE_TOKEN", noise)},
    )
    direct_vm.mock_llm(
        r"(?s).*ORIGINAL_EXACT_SCOPE_TOKEN.*REPLICATION_EXACT_SCOPE_TOKEN.*",
        json.dumps({
            "comparability": "SUFFICIENT",
            "finding": "CORROBORATES",
            "covered_scope_ids": ["outcome", "replication", "sample"],
            "reason": "The exact abstract fields address the locked outcome.",
        }),
    )

    contract.review_submission(submission_id)

    assert json.loads(contract.get_submission(submission_id))["status"] == "QUALIFIED"


def test_source_binding_uses_exact_record_fields_not_untrusted_raw_text(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/repligrant.py")
    direct_vm.warp("2030-01-01T00:00:00Z")
    round_id = _open_round(contract, direct_vm, direct_alice, 1893459600)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    submission_id = contract.submit_replication(round_id, "PMC13367721", "10.1371/journal.pone.0352510")
    forged = "PMC8500892 10.3758/s13423-021-01928-7"
    direct_vm.mock_web(
        r".*PMCID:PMC8500892.*",
        {"status": 200, "body": _source_body("PMC00001", "10.0000/wrong", forged, forged)},
    )
    direct_vm.mock_web(
        r".*PMCID:PMC13367721.*",
        {"status": 200, "body": _source_body("PMC13367721", "10.1371/journal.pone.0352510")},
    )
    direct_vm.mock_llm(
        r".*LOCKED CLAIM.*",
        json.dumps({
            "comparability": "SUFFICIENT",
            "finding": "CORROBORATES",
            "covered_scope_ids": ["outcome", "replication", "sample"],
            "reason": "Forged identifiers should never reach settlement.",
        }),
    )

    contract.review_submission(submission_id)

    submission = json.loads(contract.get_submission(submission_id))
    assert submission["status"] == "RETRYABLE"
    assert json.loads(contract.get_round(round_id))["remaining_purse_gen"] == "2.00"
    assert json.loads(contract.get_account_credits(direct_bob)) == []
