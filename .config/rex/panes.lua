-- Per-tab Pi sidebar (right, full height) and bottom terminal (under the
-- main pane only). Toggling detaches the block, so its process keeps running.

local MISE = os.getenv("HOME") .. "/.local/bin/mise"

local KINDS = {
	pi = {
		direction = "horizontal",
		size = 0.35,
		command = { MISE, "exec", "node@25", "--", "pi" },
	},
	term = {
		direction = "vertical",
		size = 0.30,
	},
}

local function blocks()
	return assert(rex.session.list_blocks{}).blocks
end

local function find(list, key, value)
	for _, b in ipairs(list) do
		if b[key] == value then
			return b
		end
	end
end

local function is_managed(b)
	return b.label ~= nil and (b.label:match("^pi:") or b.label:match("^term:")) ~= nil
end

-- Pane that Pi/terminal attach to: the focused one, or the first regular
-- pane in the tab when focus is on Pi or the terminal.
local function main_block(list, focused)
	if not is_managed(focused) then
		return focused
	end
	for _, b in ipairs(list) do
		if b.window_id == focused.window_id and b.placement == "placed" and not is_managed(b) then
			return b
		end
	end
	error("No main pane in this tab")
end

local function cwd(block_id)
	local p = rex.block.call("com.superlogical.terminal", "process", { block_id = block_id })
	return p and p.foreground and p.foreground.cwd
end

local function place(kind, existing, main)
	local k = KINDS[kind]
	if existing then
		return assert(rex.session.move_block{
			block_id = existing.block_id,
			anchor_block_id = main.block_id,
			direction = k.direction,
			side = "after",
			ratio = 1 - k.size,
		})
	end
	return assert(rex.session.new_split{
		anchor_id = main.block_id,
		direction = k.direction,
		side = "after",
		ratio = 1 - k.size,
		focus = false,
		layout = {
			block = {
				flavor = "com.superlogical.terminal.shell",
				label = kind .. ":" .. main.window_id,
				options = { cwd = cwd(main.block_id), command = k.command },
			},
		},
	})
end

local function toggle(kind)
	return function(ctx)
		local list = blocks()
		local focused = assert(find(list, "block_id", ctx.block_id), "Focus a pane first")
		local main = main_block(list, focused)
		local label = kind .. ":" .. main.window_id
		local block = find(list, "label", label)

		if block and block.placement == "placed" then
			assert(rex.session.detach_block{ block_id = block.block_id })
			return rex.session.focus_block{ block_id = main.block_id }
		end

		-- Pi must split off before the terminal so it spans the full height:
		-- park the terminal, place Pi, then put the terminal back under main.
		local term = kind == "pi" and find(list, "label", "term:" .. main.window_id)
		local term_placed = term and term.placement == "placed"
		if term_placed then
			assert(rex.session.detach_block{ block_id = term.block_id })
		end

		place(kind, block, main)
		if term_placed then
			place("term", term, main)
		end

		local placed = find(blocks(), "label", label)
		if placed then
			rex.session.focus_block{ block_id = placed.block_id }
		end
	end
end

rex.action{ name = "toggle_pi", title = "Toggle Pi sidebar", run = toggle("pi") }
rex.action{ name = "toggle_term", title = "Toggle bottom terminal", run = toggle("term") }
