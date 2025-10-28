return {
  dracula = {
    label = "Dracula",
    module = "dracula",
    match = "^dracula",
    setup = function(opts)
      require("dracula").setup({
        transparent_bg = opts.transparent,
      })
    end,
  },

  onedark = {
    label = "One Dark",
    module = "onedark",
    match = "^onedark",
    setup = function(opts)
      require("onedark").setup({
        transparent = opts.transparent,
      })
    end,
  },

  catppuccin = {
    label = "Catppuccin",
    module = "catppuccin",
    match = "^catppuccin",
    setup = function(opts)
      require("catppuccin").setup({
        transparent_background = opts.transparent,
      })
    end,
  },

  ["gruvbox-material"] = {
    label = "Gruvbox Material",
    module = nil, -- loaded via globals
    match = "^gruvbox%-material",
    setup = function(opts)
      vim.g.gruvbox_material_better_performance = 1
      vim.g.gruvbox_material_enable_italic = true
      vim.g.gruvbox_material_transparent_background = opts.transparent and 1 or 0
    end,
  },

  gruvbox = {
    label = "Gruvbox",
    module = "gruvbox",
    match = "gruvbox",
    setup = function(opts)
      require("gruvbox").setup({
        transparent_mode = opts.transparent,
      })
    end,
  },

  tokyonight = {
    label = "Tokyo Night",
    module = "tokyonight",
    match = "^tokyonight",
    setup = function(opts)
      require("tokyonight").setup({
        transparent = opts.transparent,
      })
    end,
  },

  kanagawa = {
    label = "Kanagawa",
    module = "kanagawa",
    match = "^kanagawa",
    setup = function(opts)
      require("kanagawa").setup({
        transparent = opts.transparent,
      })
    end,
  },
  ["kanagawa-wave"] = {
    label = "Kanagawa Wave",
    module = "kanagawa",
    match = "^kanagawa%-wave",
    setup = function(opts)
      require("kanagawa").setup({
        transparent = opts.transparent,
      })
    end,
  },

  ["kanagawa-lotus"] = {
    label = "Kanagawa Wave",
    module = "kanagawa",
    match = "^kanagawa%-lotus",
    setup = function(opts)
      require("kanagawa").setup({
        transparent = opts.transparent,
      })
    end,
  },

  ["kanagawa-dragon"] = {
    label = "Kanagawa Wave",
    module = "kanagawa",
    match = "^kanagawa%-dragon",
    setup = function(opts)
      require("kanagawa").setup({
        transparent = opts.transparent,
      })
    end,
  },

  ["rose-pine"] = {
    label = "Rose Pine",
    module = "rose-pine",
    match = "^rose%-pine",
    setup = function(opts)
      require("rose-pine").setup({
        styles = {
          transparency = opts.transparent,
        },
      })
    end,
  },

  vscode = {
    label = "VSCode",
    module = "vscode",
    match = "^vscode",
    setup = function(opts)
      require("vscode").setup({
        transparent = opts.transparent,
        italic_comments = true,
        underline_links = true,
        disable_nvimtree_bg = true,
      })
    end,
  },

  nord = {
    label = "Nord",
    module = "nord",
    match = "^nord",
    setup = function(opts)
      require("nord").setup({
        transparent = opts.transparent,
      })
    end,
  },

  solarized = {
    label = "Solarized",
    module = "solarized",
    match = "^solarized",
    setup = function(opts)
      vim.g.solarized_termtrans = opts.transparent and 1 or 0
    end,
  },

  everforest = {
    label = "Everforest",
    module = "everforest",
    match = "^everforest",
    setup = function(opts)
      vim.g.everforest_transparent_background = opts.transparent and 1 or 0
    end,
  },

  monokai = {
    label = "Monokai Pro",
    module = "monokai-pro",
    match = "^monokai%-pro",
    setup = function(opts)
      require("monokai-pro").setup({
        transparent_background = opts.transparent,
      })
    end,
  },

  material = {
    label = "Material",
    module = "material",
    match = "^material",
    setup = function(opts)
      vim.g.material_style = "deep ocean"
      require("material").setup({
        disable = {
          background = not opts.transparent,
        },
      })
    end,
  },

  nightfox = {
    label = "Nightfox",
    module = "nightfox",
    match = "^nightfox",
    setup = function(opts)
      require("nightfox").setup({
        options = {
          transparent = opts.transparent,
        },
      })
    end,
  },

  carbonfox = {
    label = "Carbonfox (Nightfox)",
    module = "nightfox",
    match = "^carbonfox",
    setup = function(opts)
      require("nightfox").setup({
        options = {
          transparent = opts.transparent,
        },
      })
    end,
  },

  ["github_dark_dimmed"] = {
    label = "Github Dark Dimmed",
    module = "github-theme",
    match = "^github_dark_dimmed",
    setup = function(opts)
      require("github-theme").setup({
        options = {
          transparent = opts.transparent,
        },
      })
    end,
  },
}
