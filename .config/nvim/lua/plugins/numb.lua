return {
  -- Peek on line numbers (e.g. :30 shows line 30 in a preview window)
  "nacro90/numb.nvim",
  config = function()
    require("numb").setup()
  end,
}
