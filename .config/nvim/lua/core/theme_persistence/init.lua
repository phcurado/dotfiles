local M = {}
local manager = require("core.theme_persistence.manager")

local state_dir = vim.fn.stdpath("data") .. "/theme_persistence"
local state_file = state_dir .. "/state.json"
vim.fn.mkdir(state_dir, "p")

function M.set_transparent_background(value)
  vim.g.transparent_background = value

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

  local current = vim.g.colors_name
  if current then
    manager.reapply_theme(current, { transparent = value })
  end

  vim.notify("Transparency set to: " .. tostring(value), vim.log.levels.INFO)
end

function M.toggle_transparent_background()
  M.set_transparent_background(not vim.g.transparent_background)
end

function M.setup()
  local ok, content = pcall(vim.fn.readfile, state_file)
  if ok and content then
    local decoded = vim.fn.json_decode(table.concat(content, "\n"))
    if decoded then
      vim.g.transparent_background = decoded.transparent_background or false
      if decoded.colorscheme then
        vim.g.colors_name = decoded.colorscheme
        manager.reapply_theme(decoded.colorscheme, {
          transparent = vim.g.transparent_background,
        })
      end
    end
  end

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

  vim.api.nvim_create_user_command("ThemeList", function()
    manager.pick_theme()
  end, {})

  vim.api.nvim_create_user_command("ThemeValidateRegistry", function()
    local registry = require("core.theme_persistence.registry")

    print("🔍 Validating theme registry...\n")

    local all_passed = true

    for name, meta in pairs(registry) do
      local label = meta.label or name
      local passed = true

      if meta.module then
        local ok = pcall(require, meta.module)
        if not ok then
          vim.notify("❌ Missing module for theme: " .. label, vim.log.levels.WARN)
          passed = false
        end
      else
        vim.notify("⚠️ No module for: " .. label, vim.log.levels.INFO)
      end

      if type(meta.match) ~= "string" then
        vim.notify("❌ Invalid match pattern for: " .. label, vim.log.levels.ERROR)
        passed = false
      end

      if type(meta.setup) ~= "function" then
        vim.notify("❌ Missing setup() for: " .. label, vim.log.levels.ERROR)
        passed = false
      end

      if passed then
        vim.notify("✅ " .. label .. " is valid", vim.log.levels.DEBUG)
      else
        all_passed = false
      end
    end

    if all_passed then
      vim.notify("🎉 All themes passed validation!", vim.log.levels.INFO)
    else
      vim.notify("🚨 Some themes failed. Run :messages for details.", vim.log.levels.WARN)
    end
  end, {})
end

return M
