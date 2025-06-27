return {
  {
    "rachartier/tiny-code-action.nvim",
    dependencies = {
      { "nvim-lua/plenary.nvim" },
      {
        "folke/snacks.nvim",
        opts = {
          terminal = {},
        },
      },
    },
    event = "LspAttach",
    opts = {
      picker = {
        "snacks",
        opts = {
          hotkeys = true,
        },
      },
    },
    config = function(_, opts)
      require("tiny-code-action").setup(opts)
      vim.keymap.set("n", "<leader>cd", function()
        require("tiny-code-action").code_action()
      end, { noremap = true, silent = true })
    end,
  },
  {
    "rachartier/tiny-inline-diagnostic.nvim",
    event = "VeryLazy", -- Or `LspAttach`
    priority = 1000, -- needs to be loaded in first
    config = function()
      require("tiny-inline-diagnostic").setup()
      vim.diagnostic.config({ virtual_text = false }) -- Only if needed in your configuration, if you already have native LSP diagnostics
    end,
  },
}
