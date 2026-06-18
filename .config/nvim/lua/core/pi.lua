local M = {}

local function systemlist(args)
  local out = vim.fn.systemlist(args)
  if vim.v.shell_error ~= 0 then
    return nil
  end
  return out
end

local function current_tmux_window()
  if not vim.env.TMUX then
    return nil, "not inside tmux"
  end

  local window = systemlist({ "tmux", "display-message", "-p", "#{window_id}" })
  window = window and window[1]
  if not window or window == "" then
    return nil, "could not detect tmux window"
  end

  return window
end

local function bridge_socket()
  local window, window_err = current_tmux_window()
  if not window then
    return nil, window_err
  end

  local panes = systemlist({
    "tmux",
    "list-panes",
    "-a",
    "-F",
    "#{window_id}\t#{@agent_sidebar}\t#{@agent_sidebar_home}\t#{@pi_nvim_bridge_socket}",
  })
  if not panes then
    return nil, "could not list tmux panes"
  end

  local hidden
  local pi_pane_found = false
  for _, line in ipairs(panes) do
    local pane_window, sidebar, home, socket = line:match("^([^\t]*)\t([^\t]*)\t([^\t]*)\t(.*)$")
    if sidebar == "1" and (pane_window == window or home == window) then
      pi_pane_found = true
    end
    if socket and socket ~= "" then
      if pane_window == window then
        return socket
      end
      if home == window then
        hidden = socket
      end
    end
  end

  if hidden then
    return hidden
  end

  if pi_pane_found then
    return nil, "Pi pane found, but nvim bridge is not loaded. Run /reload in Pi."
  end

  return nil, "no Pi pane found for this tmux window. Use tmux prefix+a to open the sidebar."
end

local function context_from_range(start_line, end_line)
  local buf = 0
  local file = vim.api.nvim_buf_get_name(buf)
  local cursor = vim.api.nvim_win_get_cursor(0)
  local lines = vim.api.nvim_buf_get_lines(buf, start_line - 1, end_line, false)

  return {
    cwd = vim.fn.getcwd(),
    file = file,
    relativeFile = vim.fn.fnamemodify(file, ":."),
    filetype = vim.bo.filetype,
    cursor = { line = cursor[1], column = cursor[2] + 1 },
    range = { startLine = start_line, endLine = end_line },
    text = table.concat(lines, "\n"),
  }
end

local function context_from_lines(selection)
  if selection then
    local start_pos = vim.fn.getpos("v")
    local end_pos = vim.fn.getpos(".")
    return context_from_range(math.min(start_pos[2], end_pos[2]), math.max(start_pos[2], end_pos[2]))
  end

  local cursor = vim.api.nvim_win_get_cursor(0)
  return context_from_range(cursor[1], cursor[1])
end

local function send_payload(payload)
  local socket, err = bridge_socket()
  if not socket then
    vim.notify("Pi: " .. err, vim.log.levels.ERROR)
    return
  end

  local uv = vim.uv or vim.loop
  if not uv.fs_stat(socket) then
    vim.notify("Pi: stale bridge socket " .. socket, vim.log.levels.ERROR)
    return
  end

  local pipe = uv.new_pipe(false)
  local chunks = {}

  pipe:connect(socket, function(connect_err)
    if connect_err then
      vim.schedule(function()
        vim.notify("Pi: " .. connect_err, vim.log.levels.ERROR)
      end)
      pipe:close()
      return
    end

    pipe:read_start(function(read_err, chunk)
      if read_err then
        vim.schedule(function()
          vim.notify("Pi: " .. read_err, vim.log.levels.ERROR)
        end)
      end

      if chunk then
        table.insert(chunks, chunk)
        return
      end

      pipe:close()
      local ok, response = pcall(vim.json.decode, table.concat(chunks, ""))
      vim.schedule(function()
        if ok and response and response.ok then
          vim.notify("Sent to Pi", vim.log.levels.INFO)
        else
          local message = ok and response and response.error or "invalid bridge response"
          vim.notify("Pi: " .. message, vim.log.levels.ERROR)
        end
      end)
    end)

    pipe:write(vim.json.encode(payload) .. "\n", function(write_err)
      if write_err then
        vim.schedule(function()
          vim.notify("Pi: " .. write_err, vim.log.levels.ERROR)
        end)
      end
      pipe:shutdown()
    end)
  end)
end

function M.ask(selection)
  local payload = context_from_lines(selection)

  if selection then
    vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "n", false)
  end

  vim.ui.input({ prompt = "Ask Pi: " }, function(input)
    if not input or input == "" then
      return
    end
    payload.prompt = input
    send_payload(payload)
  end)
end

function M.command(opts)
  local payload
  if opts.range > 0 then
    payload = context_from_range(opts.line1, opts.line2)
  else
    payload = context_from_lines(false)
  end

  vim.ui.input({ prompt = "Ask Pi: " }, function(input)
    if not input or input == "" then
      return
    end
    payload.prompt = input
    send_payload(payload)
  end)
end

function M.command_abbrev()
  if vim.fn.getcmdtype() ~= ":" then
    return "pi"
  end

  local cmdline = vim.fn.getcmdline()
  local before_cursor = cmdline:sub(1, vim.fn.getcmdpos() - 1)

  if before_cursor == "pi" or before_cursor == "'<,'>pi" or before_cursor == "'<,'>" then
    return "Pi"
  end

  return "pi"
end

function M.setup()
  vim.api.nvim_create_user_command("Pi", M.command, { range = true, desc = "Ask Pi about current line or range" })
  vim.cmd([[cnoreabbrev <expr> pi v:lua.require('core.pi').command_abbrev()]])

end

return M
