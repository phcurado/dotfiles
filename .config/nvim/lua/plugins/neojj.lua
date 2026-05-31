return {
  "NicholasZolton/neojj",
  lazy = true,
  dependencies = {
    "nvim-lua/plenary.nvim", -- required

    -- Only one of these is needed.
    "sindrets/diffview.nvim", -- optional
    "esmuellert/codediff.nvim", -- optional

    -- Only one of these is needed.
    "nvim-telescope/telescope.nvim", -- optional
    "ibhagwan/fzf-lua", -- optional
    "nvim-mini/mini.pick", -- optional
    "folke/snacks.nvim", -- optional
  },
  cmd = "Neojj",
  keys = {
    { "<leader>gj", "<cmd>Neojj<cr>", desc = "Show Neojj UI" },
  },
}
