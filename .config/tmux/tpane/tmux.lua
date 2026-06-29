tpane.opt.allow_passthrough = true
tpane.append("update_environment", "TERM")
tpane.append("update_environment", "TERM_PROGRAM")
tpane.opt.extended_keys = true
tpane.opt.extended_keys_format = "csi-u"
tpane.opt.mode_keys = "vi"
tpane.opt.mouse = true
tpane.opt.renumber_windows = true
tpane.opt.set_clipboard = true

tpane.unbind("r")

tpane.bind("r", tpane.run("reload"), { desc = "Reload config" })

tpane.bind("h", tpane.pane.select("left"), { desc = "Select pane left" })
tpane.bind("j", tpane.pane.select("down"), { desc = "Select pane down" })
tpane.bind("k", tpane.pane.select("up"), { desc = "Select pane up" })
tpane.bind("l", tpane.pane.select("right"), { desc = "Select pane right" })

tpane.bind("M-Left", tpane.pane.resize("left", 10), { prefix = false, desc = "Resize pane left" })
tpane.bind("M-Right", tpane.pane.resize("right", 10), { prefix = false, desc = "Resize pane right" })
tpane.bind("M-Down", tpane.pane.resize("down", 10), { prefix = false, desc = "Resize pane down" })
tpane.bind("M-Up", tpane.pane.resize("up", 10), { prefix = false, desc = "Resize pane up" })

tpane.bind("v", tpane.copy.begin(), { mode = "copy", desc = "Begin visual selection" })
tpane.bind("r", tpane.copy.rectangle(), { mode = "copy", desc = "Toggle rectangle selection" })

tpane.bind("c", tpane.window.new({ cwd = "pane" }), { desc = "New window from pane cwd" })
tpane.bind("%", tpane.pane.split("right", { cwd = "pane" }), { desc = "Split pane right" })
tpane.bind('"', tpane.pane.split("down", { cwd = "pane" }), { desc = "Split pane down" })

tpane.bind("C-S-l", tpane.window.swap("next"), { prefix = false, desc = "Swap window next" })
tpane.bind("C-S-h", tpane.window.swap("prev"), { prefix = false, desc = "Swap window previous" })
