local M = {}

local database = require("core.theme_persistence.database")

local state_dir = vim.fn.stdpath("data") .. "/theme_persistence"
local state_file = state_dir .. "/state.json"

local function ensure_state_dir()
  vim.fn.mkdir(state_dir, "p")
end

local function load_state()
  local ok, content = pcall(vim.fn.readfile, state_file)
  if ok and content and #content > 0 then
    local decoded = vim.fn.json_decode(table.concat(content, "\n"))
    if decoded then
      return decoded
    end
  end
  return {}
end

local function save_state(state)
  ensure_state_dir()
  local encoded = vim.fn.json_encode(state)
  vim.fn.writefile({ encoded }, state_file)
end

local function find_config(colorscheme)
  for key, config in pairs(database) do
    local patterns = config.patterns or { "^" .. key:gsub("%-", "%%-") }
    for _, pattern in ipairs(patterns) do
      if colorscheme:match(pattern) then
        return config, key
      end
    end
  end
  return nil, nil
end

local function is_module_available(module_name)
  if not module_name then
    return true
  end
  local ok = pcall(require, module_name)
  return ok
end

local function apply_transparency(config, value)
  if not config or not config.transparent then
    return
  end

  local spec = config.transparent

  if type(spec) == "function" then
    spec(value)
    return
  end

  if type(spec) == "string" then
    if spec:match("^g:") then
      local var_name = spec:match("^g:([^:]+)")
      local use_num = spec:match(":num$")
      if use_num then
        vim.g[var_name] = value and 1 or 0
      else
        vim.g[var_name] = value
      end
      return
    end

    if spec:match("%.") then
      local parts = vim.split(spec, "%.")
      local opts = {}
      local current = opts
      for i = 1, #parts - 1 do
        current[parts[i]] = {}
        current = current[parts[i]]
      end
      current[parts[#parts]] = value

      if config.module then
        local ok, mod = pcall(require, config.module)
        if ok and mod.setup then
          mod.setup(opts)
        end
      end
      return
    end

    if config.module then
      local ok, mod = pcall(require, config.module)
      if ok and mod.setup then
        mod.setup({ [spec] = value })
      end
    end
  end
end

function M.apply_theme(colorscheme, opts)
  opts = opts or {}
  local config = find_config(colorscheme)

  if config then
    if config.setup then
      config.setup()
    end

    if opts.transparent ~= nil then
      apply_transparency(config, opts.transparent)
    end
  end

  local ok, err = pcall(vim.cmd.colorscheme, colorscheme)
  if not ok then
    vim.notify("Failed to apply colorscheme: " .. colorscheme .. "\n" .. err, vim.log.levels.ERROR)
    return false
  end

  return true
end

function M.set_transparent(value)
  vim.g.transparent_background = value

  local state = load_state()
  state.transparent_background = value
  save_state(state)

  local current = vim.g.colors_name
  if current then
    M.apply_theme(current, { transparent = value })
  end

  vim.notify("Transparency: " .. (value and "enabled" or "disabled"), vim.log.levels.INFO)
end

function M.toggle_transparent()
  M.set_transparent(not vim.g.transparent_background)
end

function M.available_themes()
  local themes = {}
  local seen = {}

  for key, config in pairs(database) do
    if is_module_available(config.module) then
      local patterns = config.patterns or { "^" .. key:gsub("%-", "%%-") }

      if #patterns == 1 and patterns[1] == "^" .. key:gsub("%-", "%%-") then
        if not seen[key] then
          table.insert(themes, { name = key, label = key })
          seen[key] = true
        end
      else
        table.insert(themes, { name = key, label = key .. " (and variants)" })
      end
    end
  end

  table.sort(themes, function(a, b)
    return a.label < b.label
  end)

  return themes
end

function M.pick_theme()
  local has_snacks, snacks = pcall(require, "snacks")
  if has_snacks and snacks.picker and snacks.picker.colorschemes then
    snacks.picker.colorschemes({
      layout = {
        preset = "ivy",
        layout = { position = "bottom", backdrop = 70 },
      },
    })
  else
    local all_colorschemes = vim.fn.getcompletion("", "color")
    vim.ui.select(all_colorschemes, { prompt = "Select colorscheme:" }, function(choice)
      if choice then
        M.apply_theme(choice, { transparent = vim.g.transparent_background })
      end
    end)
  end
end

function M.setup(opts)
  opts = opts or {}
  ensure_state_dir()

  local state = load_state()
  vim.g.transparent_background = state.transparent_background or false

  if state.colorscheme then
    M.apply_theme(state.colorscheme, { transparent = vim.g.transparent_background })
  end

  vim.api.nvim_create_autocmd("ColorScheme", {
    group = vim.api.nvim_create_augroup("ThemePersistence", { clear = true }),
    callback = function(args)
      local current_state = load_state()
      current_state.colorscheme = args.match
      save_state(current_state)

      if vim.g.transparent_background then
        vim.schedule(function()
          local config = find_config(args.match)
          if config then
            if config.setup then
              config.setup()
            end
            apply_transparency(config, true)
          end
        end)
      end
    end,
  })

  vim.api.nvim_create_user_command("ThemePick", function()
    M.pick_theme()
  end, { desc = "Pick a colorscheme with preview" })

  vim.api.nvim_create_user_command("ThemeToggleTransparency", function()
    M.toggle_transparent()
  end, { desc = "Toggle transparent background" })

  vim.api.nvim_create_user_command("ThemeSetTransparency", function(cmd_opts)
    local value = cmd_opts.args == "true" or cmd_opts.args == "1" or cmd_opts.args == "on"
    M.set_transparent(value)
  end, {
    nargs = 1,
    complete = function()
      return { "true", "false", "on", "off" }
    end,
    desc = "Set transparent background",
  })
end

return M
