local registry = require("core.theme_persistence.registry")

local M = {}

function M.reapply_theme(theme_name, opts)
  for key, meta in pairs(registry) do
    if theme_name:match(meta.match) then
      if meta.module and not pcall(require, meta.module) then
        vim.notify("Theme '" .. meta.label .. "' is not installed", vim.log.levels.WARN)
        return false
      end

      if meta.setup then
        meta.setup(opts or {})
      end

      vim.cmd.colorscheme(theme_name)
      return true
    end
  end

  -- Fallback for themes not in registry
  vim.cmd.colorscheme(theme_name)
  vim.notify("Applied unregistered theme: " .. theme_name, vim.log.levels.INFO)
  return true
end

-- List installed themes from the registry
function M.available_themes()
  local out = {}
  for key, meta in pairs(registry) do
    local is_installed = not meta.module or pcall(require, meta.module)
    if is_installed then
      table.insert(out, { name = key, label = meta.label or key })
    end
  end
  table.sort(out, function(a, b)
    return a.label < b.label
  end)
  return out
end

-- UI to pick a theme
function M.pick_theme()
  local themes = M.available_themes()
  local labels = vim.tbl_map(function(t)
    return t.name
  end, themes)

  vim.ui.select(labels, { prompt = "Select a theme" }, function(choice)
    if not choice then
      return
    end

    vim.g.colors_name = choice
    require("core.theme_persistence").set_transparent_background(vim.g.transparent_background or false)
    vim.notify("Theme applied: " .. choice)
  end)
end

return M
