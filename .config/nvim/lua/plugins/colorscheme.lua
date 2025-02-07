return {
  {
    "Mofiqul/dracula.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("dracula").setup({
        transparent_bg = false,
      })
      -- vim.cmd.colorscheme("dracula")
    end,
  },
  {
    "navarasu/onedark.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      -- require("onedark").load()
    end,
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    opts = {},
    config = function()
      require("catppuccin").setup({
        transparent_background = false,
      })
      -- vim.cmd.colorscheme("catppuccin")
    end,
  },
  {
    "ellisonleao/gruvbox.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("gruvbox").setup({
        transparent_mode = false,
        -- contrast = "soft", -- can be "hard", "soft" or empty string
      })
      -- vim.opt.background = "light"
      -- vim.cmd.colorscheme("gruvbox")
    end,
  },
  {
    "sainnhe/gruvbox-material",
    lazy = false,
    priority = 1000,
    config = function()
      -- :h gruvbox-material.txt
      -- vim.g.gruvbox_material_background = "hard"
      --
      -- For better performance
      vim.g.gruvbox_material_better_performance = 1
      vim.g.gruvbox_material_enable_italic = true
      -- vim.g.gruvbox_material_foreground = "mix"
      -- vim.g.gruvbox_material_transparent_background = 1
      -- vim.cmd.colorscheme("gruvbox-material")
    end,
  },
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("tokyonight").setup({
        transparent = false,
      })
      -- vim.cmd.colorscheme("tokyonight-storm")
    end,
  },
  {
    "rebelot/kanagawa.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      -- vim.cmd.colorscheme("kanagawa-lotus")
    end,
  },
  {
    "rose-pine/neovim",
    name = "rose-pine",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("rose-pine").setup({
        styles = {
          transparency = true,
        },
      })
      -- vim.cmd.colorscheme("rose-pine")
    end,
  },
  {
    "Mofiqul/vscode.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("vscode").setup({
        transparent = false,
        italic_comments = true,
        underline_links = true,
        disable_nvimtree_bg = true,
      })
    end,
  },
  {
    "gbprod/nord.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("nord").setup({})
    end,
  },
}
