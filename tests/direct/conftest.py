from pathlib import Path
import os
import tempfile

import pytest
from gltest.direct.loader import deploy_contract


DIRECT_SDK_VERSION = "v0.2.16"


def _install_windows_stdin_patch() -> None:
    from gltest.direct import loader
    from gltest.direct.vm import VMContext
    if getattr(loader, "_repligrant_time_patch", False):
        return

    original_warp = VMContext.warp

    def warp_with_datetime(self: VMContext, timestamp: str) -> None:
        original_warp(self, timestamp)
        import genlayer.gl as gl
        if hasattr(gl, "message_raw") and gl.message_raw is not None:
            gl.message_raw["datetime"] = timestamp

    VMContext.warp = warp_with_datetime
    loader._repligrant_time_patch = True

    if os.name != "nt":
        return
    if getattr(loader, "_repligrant_windows_stdin_patch", False):
        return

    def inject_message_to_fd0(vm: VMContext) -> None:
        from genlayer.py import calldata
        from genlayer.py.types import Address

        sender = Address(vm.sender) if isinstance(vm.sender, bytes) else vm.sender
        contract = Address(vm._contract_address) if isinstance(vm._contract_address, bytes) else vm._contract_address
        origin = Address(vm.origin) if isinstance(vm.origin, bytes) else vm.origin
        encoded = calldata.encode({
            "contract_address": contract,
            "sender_address": sender,
            "origin_address": origin,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        })
        fd, path = tempfile.mkstemp()
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
        os.close(fd)
        vm._repligrant_stdin_temp_path = path

    original_cleanup = VMContext._cleanup_after_deactivate
    def cleanup_after_deactivate(self: VMContext) -> None:
        try:
            original_cleanup(self)
        finally:
            path = getattr(self, "_repligrant_stdin_temp_path", None)
            if path:
                try:
                    os.unlink(path)
                except FileNotFoundError:
                    pass
                self._repligrant_stdin_temp_path = None

    loader._inject_message_to_fd0 = inject_message_to_fd0
    loader._repligrant_windows_stdin_patch = True
    VMContext._cleanup_after_deactivate = cleanup_after_deactivate


_install_windows_stdin_patch()


@pytest.fixture
def direct_deploy(direct_vm):
    def _deploy(contract_path: str):
        path = Path(contract_path)
        if not path.is_absolute():
            path = (Path.cwd() / path).resolve()
        return deploy_contract(path, direct_vm, sdk_version=DIRECT_SDK_VERSION)

    return _deploy
