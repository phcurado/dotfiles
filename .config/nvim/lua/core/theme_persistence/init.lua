local M = {}

local state_dir = vim.fn.stdpath("data") .. "/theme_persistence"
local state_file = state_dir .. "/state.json"

vim.fn.mkdir(state_dir, "p")

function M.set_transparent_background(value)
  vim.g.transparent_background = value

  -- Save state
  local settings = {}
  local ok, content = pcall(vim.fn.readfile, state_file)
  if ok and content then
    local decoded = vim.fn.json_decode(table.concat(content, "\n"))
    if decoded then
      settings = decoded
    end
  end

  settings.transparent_background = value
  local encoded = vim.fn.json_encode(settings)
  vim.fn.writefile(vim.fn.split(encoded, "\n"), state_file)

  -- Reapply current colorscheme to reflect new transparency
  local current = vim.g.colors_name
  if current then
    vim.cmd.colorscheme(current)
  end

  vim.notify("Transparency set to: " .. tostring(value), vim.log.levels.INFO)
end

function M.toggle_transparent_background()
  local current = vim.g.transparent_background or false
  local new_value = not current
  M.set_transparent_background(new_value)
end

function M.setup(_opts)
  -- Load saved state
  local ok, content = pcall(vim.fn.readfile, state_file)
  if ok and content then
    local decoded = vim.fn.json_decode(table.concat(content, "\n"))
    if decoded then
      vim.g.transparent_background = decoded.transparent_background or false
      -- Apply colorscheme early (but may be overridden if theme plugin runs after)
      if decoded.colorscheme then
        vim.cmd.colorscheme(decoded.colorscheme)
      end
    end
  end

  -- Setup autocmd to persist changes
  vim.api.nvim_create_autocmd("ColorScheme", {
    group = vim.api.nvim_create_augroup("ThemePersistence", { clear = true }),
    callback = function(args)
      local settings = {
        colorscheme = args.match,
        transparent_background = vim.g.transparent_background or false,
      }
      local encoded = vim.fn.json_encode(settings)
      vim.fn.writefile(vim.fn.split(encoded, "\n"), state_file)
    end,
  })

  vim.api.nvim_create_user_command("ToggleTransparency", function()
    M.toggle_transparent_background()
  end, {})
end

return M
