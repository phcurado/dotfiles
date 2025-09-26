return {
  {
    "zbirenbaum/copilot.lua",
    dependencies = { "copilotlsp-nvim/copilot-lsp" },
    cmd = "Copilot",
    event = "InsertEnter",
    config = function()
      require("copilot").setup({
        suggestion = { enabled = false }, -- Enable inline suggestions
        panel = { enabled = false }, -- Disable the panel
        nes = { enabled = true },
      })
    end,
  },
  {
    "CopilotC-Nvim/CopilotChat.nvim",
    dependencies = {
      { "github/copilot.vim" },
      { "nvim-lua/plenary.nvim", branch = "master" },
    },
    build = "make tiktoken", -- Only on MacOS or Linux
    opts = {},
  },
}
