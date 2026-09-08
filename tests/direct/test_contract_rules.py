from pathlib import Path


CONTRACT_SOURCE = Path("contracts/repligrant.py").read_text(encoding="ascii")


def test_contract_is_ascii_pinned_and_has_one_class():
    assert CONTRACT_SOURCE.startswith("# { \"Depends\": \"py-genlayer:")
    assert CONTRACT_SOURCE.count("(gl.Contract):") == 1
    assert "py-genlayer:test" not in CONTRACT_SOURCE
    assert "py-genlayer:latest" not in CONTRACT_SOURCE
    assert "from genlayer import *" in CONTRACT_SOURCE


def test_structured_storage_and_public_interface_are_present():
    for declaration in (
        "rounds: TreeMap[str, RoundRecord]",
        "submissions: TreeMap[str, SubmissionRecord]",
        "credits: TreeMap[str, CreditRecord]",
        "round_ids: DynArray[str]",
        "submission_ids: DynArray[str]",
        "credit_ids: DynArray[str]",
    ):
        assert declaration in CONTRACT_SOURCE
    for method in (
        "open_round(",
        "submit_replication(",
        "review_submission(",
        "close_round(",
        "withdraw_credit(",
        "get_round(",
        "list_rounds(",
        "get_account_credits(",
        "get_activity(",
    ):
        assert method in CONTRACT_SOURCE


def test_consensus_compares_meaning_and_blocks_unbound_source():
    assert "gl.vm.run_nondet" in CONTRACT_SOURCE
    assert "def validator_fn(leader_result)" in CONTRACT_SOURCE
    assert 'mine.get("decision") == leader_result.calldata.get("decision")' in CONTRACT_SOURCE
    assert "_source_bound" in CONTRACT_SOURCE
    assert "covered_scope_ids" in CONTRACT_SOURCE
    assert "DECISION_RETRYABLE" in CONTRACT_SOURCE


def test_value_safety_and_temporal_guards_are_explicit():
    assert "@gl.public.write.payable" in CONTRACT_SOURCE
    assert "2 GEN" in CONTRACT_SOURCE
    assert "_now() >= int(round_record.deadline)" in CONTRACT_SOURCE
    assert "_now() < int(round_record.deadline)" in CONTRACT_SOURCE
    assert "emit_transfer(value=u256(amount))" in CONTRACT_SOURCE
    assert 'credit.status = "WITHDRAWN"' in CONTRACT_SOURCE
