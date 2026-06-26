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
      { "<leader>J", "<cmd>Neojj<cr>", desc = "Show Neojj UI" },
    },
  },
  {
    "nicolasgb/jj.nvim",
    version = "*",
    config = function()
      vim.keymap.set("n", "<leader>jj", ":J<CR>", { noremap = true, desc = "Open JJ" })

      require("jj").setup({
        diff = {
          backend = "codediff",
        },
      })
    end,
  },
}
