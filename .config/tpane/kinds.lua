local function agent_state(p)
	local pushed = p:var("@tpane_push_state")
	if pushed then
		return pushed
	end
	local out = p:capture()
	if out:match("Do you want to") or out:match("Esc to cancel") or out:match("Yes, allow") then
		return "approval"
	end
	if out:match("esc to interrupt") or out:match("[Ww]orking through it") then
		return "working"
	end
	return "idle"
end

tpane.state("approval", { color = "yellow", glyph = "" })

tpane.kind({
	name = "pi",
	detect = function(p)
		return p:running("pi-coding-agent") or p:running("@earendil-works/pi") or p:running("pi")
	end,
	label = function()
		return "pi"
	end,
	color = "yellow",
	tag = "agent",
	state = agent_state,
})

tpane.kind({
	name = "claude",
	match = "claude",
	label = function()
		return "claude"
	end,
	color = "yellow",
	tag = "agent",
	state = agent_state,
})

tpane.kind({
	name = "codex",
	match = "codex",
	label = function()
		return "codex"
	end,
	color = "yellow",
	tag = "agent",
	state = agent_state,
})

tpane.kind({ name = "nvim", match = "nvim" })

tpane.kind({
	name = "bottom",
	detect = function(p)
		return p.tag == "terminal"
	end,
	label = function()
		return "bottom"
	end,
})
