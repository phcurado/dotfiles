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
      "sindrets/diffview.nvim",
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
}
