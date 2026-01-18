return {
  tokyonight = {
    module = "tokyonight",
    transparent = "transparent",
  },

  onedark = {
    module = "onedark",
    transparent = "transparent",
  },

  kanagawa = {
    module = "kanagawa",
    patterns = { "^kanagawa" },
    transparent = "transparent",
  },

  nord = {
    module = "nord",
    transparent = "transparent",
  },

  dracula = {
    module = "dracula",
    transparent = "transparent_bg",
  },

  catppuccin = {
    module = "catppuccin",
    transparent = "transparent_background",
  },

  gruvbox = {
    module = "gruvbox",
    patterns = { "^gruvbox$" },
    transparent = "transparent_mode",
  },

  ["monokai-pro"] = {
    module = "monokai-pro",
    patterns = { "^monokai" },
    transparent = "transparent_background",
  },

  ["rose-pine"] = {
    module = "rose-pine",
    transparent = "styles.transparency",
  },

  nightfox = {
    module = "nightfox",
    patterns = { "^nightfox", "^carbonfox", "^dawnfox", "^dayfox", "^duskfox", "^nordfox", "^terafox" },
    transparent = "options.transparent",
  },

  ["github-theme"] = {
    module = "github-theme",
    patterns = { "^github_" },
    transparent = "options.transparent",
  },

  ["gruvbox-material"] = {
    module = nil,
    patterns = { "^gruvbox%-material" },
    transparent = "g:gruvbox_material_transparent_background:num",
    setup = function()
      vim.g.gruvbox_material_better_performance = 1
      vim.g.gruvbox_material_enable_italic = true
    end,
  },

  solarized = {
    module = "solarized",
    transparent = "g:solarized_termtrans:num",
  },

  everforest = {
    module = "everforest",
    transparent = "g:everforest_transparent_background:num",
  },

  vscode = {
    module = "vscode",
    transparent = function(value)
      require("vscode").setup({
        transparent = value,
        italic_comments = true,
        underline_links = true,
        disable_nvimtree_bg = true,
      })
    end,
  },

  material = {
    module = "material",
    transparent = function(value)
      vim.g.material_style = "deep ocean"
      require("material").setup({
        disable = { background = value },
      })
    end,
  },
}
