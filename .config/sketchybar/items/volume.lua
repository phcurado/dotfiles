local icons = require("icons")
local colors = require("colors")
local settings = require("settings")

-- Speaker icon (click opens audio output settings)
local volume_icon = sbar.add("item", "volume.icon", {
	position = "right",
	icon = {
		string = icons.volume._100,
		color = colors.grey,
		font = { family = settings.font.text, style = settings.font.style_map["Regular"], size = 14.0 },
		padding_left = 4,
		padding_right = 4,
	},
	label = { drawing = false },
})

-- Draggable slider: hidden by default, expands when the icon is clicked
local volume_slider = sbar.add("slider", "volume.slider", 0, {
	position = "right",
	slider = {
		highlight_color = colors.blue,
		background = { height = 5, corner_radius = 3, color = colors.bg2 },
		knob = { string = "􀀁", drawing = false },
		width = 0,
	},
	icon = { drawing = false },
	label = { drawing = false },
	click_script = 'osascript -e "set volume output volume $PERCENTAGE"',
})

local slider_shown = false
local function apply_slider()
	sbar.animate("tanh", 20, function()
		volume_slider:set({
			slider = { width = slider_shown and 70 or 0 },
			padding_left = slider_shown and 8 or 0,
			padding_right = slider_shown and 8 or 0,
		})
	end)
end

volume_icon:subscribe("mouse.clicked", function()
	slider_shown = not slider_shown
	apply_slider()
end)

volume_slider:subscribe("mouse.exited.global", function()
	if slider_shown then
		slider_shown = false
		apply_slider()
	end
end)

local function set_icon(v)
	local icon = icons.volume._0
	if v > 60 then
		icon = icons.volume._100
	elseif v > 30 then
		icon = icons.volume._66
	elseif v > 10 then
		icon = icons.volume._33
	elseif v > 0 then
		icon = icons.volume._10
	end
	volume_icon:set({ icon = icon })
end

volume_slider:subscribe("volume_change", function(env)
	local v = tonumber(env.INFO) or 0
	set_icon(v)
	volume_slider:set({ slider = { percentage = v } })
end)

local function scroll(env)
	local delta = env.SCROLL_DELTA or 0
	sbar.exec(
		'osascript -e "set volume output volume (output volume of (get volume settings) + ' .. (delta * 5) .. ')"'
	)
end
volume_icon:subscribe("mouse.scrolled", scroll)
volume_slider:subscribe("mouse.scrolled", scroll)
