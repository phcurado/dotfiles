return {
  {
    -- Displays decorated scrollbars.
    "lewis6991/satellite.nvim",
    event = "VeryLazy",
    config = function()
      require("satellite").setup({})
    end,
  },
}
