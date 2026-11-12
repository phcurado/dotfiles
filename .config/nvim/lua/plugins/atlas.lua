return {
  "emrearmagan/atlas.nvim",
  cmd = "Atlas",
  dependencies = {
    "nvim-tree/nvim-web-devicons",
    "esmuellert/codediff.nvim",
  },
  opts = {
    keymaps = {
      pulls = {
        review = {
          show_details = "gK",
        },
      },
    },
    providers = {
      github = {},
    },
    pulls = {
      diff = {
        lsp = { enabled = true },
      },
    },
  },
}
