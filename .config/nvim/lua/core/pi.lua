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

local function context_from_lines(selection)
  local buf = 0
  local file = vim.api.nvim_buf_get_name(buf)
  local cursor = vim.api.nvim_win_get_cursor(0)
  local start_line
  local end_line

  if selection then
    local start_pos = vim.fn.getpos("v")
    local end_pos = vim.fn.getpos(".")
    start_line = math.min(start_pos[2], end_pos[2])
    end_line = math.max(start_pos[2], end_pos[2])
  else
    start_line = cursor[1]
    end_line = cursor[1]
  end

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

function M.setup()
  vim.keymap.set("n", "<leader>pi", function()
    M.ask(false)
  end, { desc = "Ask Pi about current line" })

  vim.keymap.set("v", "<leader>pi", function()
    M.ask(true)
  end, { desc = "Ask Pi about selection" })

  vim.keymap.set("n", "<leader>ps", function()
    M.ask(false)
  end, { desc = "Ask Pi about current line" })

  vim.keymap.set("v", "<leader>ps", function()
    M.ask(true)
  end, { desc = "Ask Pi about selection" })
end

return M
