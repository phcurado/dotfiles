local colors = require("colors")

-- Floating, rounded bar (matches the previous shell design)
sbar.bar({
	height = 39,
	color = colors.bar.bg,
	shadow = true,
	position = "top",
	sticky = true,
	padding_right = 10,
	padding_left = 10,
	corner_radius = 9,
	y_offset = 10,
	margin = 10,
	blur_radius = 20,
	notch_width = 0,
})
