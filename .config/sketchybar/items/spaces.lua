local colors = require("colors")
local settings = require("settings")
local app_icons = require("helpers.app_icons")

local workspace_ids = { 1, 2, 3, 4 }
local spaces = {}

sbar.add("event", "aerospace_workspace_change")
sbar.add("event", "aerospace_windows_change")

local function refresh_focus(focused)
  for _, sid in ipairs(workspace_ids) do
    local sel = (sid == focused)
    spaces[sid]:set({
      icon = { highlight = sel },
      background = {
        drawing = sel,
        color = sel and colors.with_alpha(colors.blue, 0.25) or colors.transparent,
        border_color = colors.blue,
        border_width = sel and 1 or 0,
      },
    })
  end
end

for _, sid in ipairs(workspace_ids) do
  local space = sbar.add("item", "space." .. sid, {
    icon = {
      string = tostring(sid),
      padding_left = 10,
      padding_right = 15,
      color = colors.white,
      highlight_color = colors.red,
      font = { family = settings.font.numbers, style = settings.font.style_map["Bold"], size = 14.0 },
    },
    label = {
      padding_right = 16,
      font = "sketchybar-app-font:Regular:16.0",
      y_offset = -1,
      drawing = false,
    },
    padding_left = 2,
    padding_right = 2,
    background = { height = 26, corner_radius = 8, drawing = false },
    click_script = "aerospace workspace " .. sid,
  })
  spaces[sid] = space
end

local function refresh_all_windows()
  sbar.exec(
    "aerospace list-windows --workspace 1 2 3 4 --json --format '%{workspace} %{app-name}'",
    function(windows)
      local labels = { "", "", "", "" }
      local seen = {}

      for _, window in ipairs(windows) do
        local sid = tonumber(window.workspace)
        local app = window["app-name"]
        local key = sid .. "\0" .. app
        if not seen[key] then
          seen[key] = true
          labels[sid] = labels[sid] .. " " .. (app_icons[app] or app_icons["Default"])
        end
      end

      for _, sid in ipairs(workspace_ids) do
        spaces[sid]:set({
          label = { string = labels[sid], drawing = labels[sid] ~= "" },
        })
      end
    end
  )
end

spaces[1]:subscribe("aerospace_workspace_change", function(env)
  refresh_focus(tonumber(env.FOCUSED_WORKSPACE))
  refresh_all_windows()
end)

spaces[1]:subscribe({ "aerospace_windows_change", "space_windows_change", "front_app_switched" }, refresh_all_windows)

-- Group all spaces in one rounded bracket
sbar.add("bracket", "spaces.bracket", { "space.1", "space.2", "space.3", "space.4" }, {
  background = {
    color = colors.bg1,
    border_color = colors.bg2,
    border_width = 2,
    corner_radius = 9,
    height = 30,
  },
})

-- Initial paint
sbar.exec("aerospace list-workspaces --focused", function(focused)
  refresh_focus(tonumber((focused:gsub("%s+", ""))))
  refresh_all_windows()
end)
