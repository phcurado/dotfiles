return {
  {
    "elixir-tools/elixir-tools.nvim",
    event = { "BufReadPre", "BufNewFile" },
    config = function()
      require("elixir").setup({
        nextls = {
          enable = false,
          cmd = "nextls"
        },
        elixirls = {
          enable = true,
          cmd = "elixir-ls"
        },
        projectionist = { enable = true },
      })
    end
  },
}
