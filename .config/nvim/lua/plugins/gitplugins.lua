return {
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      require("gitsigns").setup({
        current_line_blame = true,
      })
    end,
  },
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "esmuellert/codediff.nvim",
      "m00qek/baleia.nvim",
      "folke/snacks.nvim",
    },
    keys = {
      { "<leader>gg", ":lua require('neogit').open()<CR>", desc = "Open Neogit" },
    },
    config = function()
      require("neogit").setup({
        disable_signs = true,
      })
    end,
  },
  {
    "esmuellert/codediff.nvim",
    cmd = "CodeDiff",
  },
  {
    "NicholasZolton/neojj",
    lazy = true,
    dependencies = {
      "nvim-lua/plenary.nvim",
      "esmuellert/codediff.nvim",
      "folke/snacks.nvim",
    },
    cmd = "Neojj",
    keys = {
      { "<leader>jj", "<cmd>Neojj<cr>", desc = "Show Neojj UI" },
    },
  },
}
