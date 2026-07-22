local original = vim.env.PI_REVIEW_ORIGINAL
local proposed = vim.env.PI_REVIEW_PROPOSED
local decision = vim.env.PI_REVIEW_DECISION
local display_path = vim.env.PI_REVIEW_PATH or proposed

if not original or not proposed or not decision then
  error("Missing Pi review environment")
end

vim.g.disable_autoformat = true
vim.opt.diffopt = "internal,filler,closeoff,vertical,context:6,linematch:40,algorithm:histogram"
vim.cmd("highlight DiffAdd guibg=#263f31 guifg=NONE")
vim.cmd("highlight DiffDelete guibg=#4a252b guifg=NONE")
vim.cmd("highlight DiffChange guibg=#27364a guifg=NONE")
vim.cmd("highlight DiffText guibg=#31533a guifg=NONE gui=bold")
vim.cmd("highlight Folded guibg=#1f2335 guifg=#8c94b8")
vim.opt.title = true
vim.opt.titlestring = "Pi review: " .. display_path
vim.opt.laststatus = 2

local original_buf = vim.fn.bufnr(original)
local proposed_buf = vim.fn.bufnr(proposed)

local function approve()
  if proposed_buf <= 0 then
    vim.notify("Review: proposed buffer not found", vim.log.levels.ERROR)
    return
  end

  vim.bo[proposed_buf].readonly = false
  vim.bo[proposed_buf].modifiable = true
  vim.api.nvim_buf_call(proposed_buf, function()
    vim.cmd("silent noautocmd write!")
  end)
  vim.fn.writefile({ "approve" }, decision)
  vim.cmd("qall!")
end

local function cancel()
  vim.cmd("cquit")
end

local function show_help()
  local lines = {
    " Pi review keys ",
    "",
    "ga / <Space>a   approve",
    "gq / <Space>q   cancel",
    "]c / [c         next / previous change",
    "zo / zc         open / close fold",
    "za              toggle fold",
    "zR / zM         open / close all folds",
    "<C-w>h/l        switch original / proposed",
    "i / a           edit proposed buffer",
    "",
    "q / <Esc> / g?  close help",
  }
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  vim.bo[buf].modifiable = false
  local width = 48
  local win = vim.api.nvim_open_win(buf, true, {
    relative = "editor",
    width = width,
    height = #lines,
    row = math.max(0, math.floor((vim.o.lines - #lines) / 2) - 1),
    col = math.max(0, math.floor((vim.o.columns - width) / 2)),
    style = "minimal",
    border = "rounded",
    title = " Help ",
    title_pos = "center",
  })
  local close = function()
    if vim.api.nvim_win_is_valid(win) then
      vim.api.nvim_win_close(win, true)
    end
  end
  for _, key in ipairs({ "q", "<Esc>", "g?" }) do
    vim.keymap.set("n", key, close, { buffer = buf, silent = true })
  end
end

vim.api.nvim_create_user_command("Approve", approve, {})
vim.api.nvim_create_user_command("Cancel", cancel, {})
vim.cmd("cnoreabbrev w Approve")
vim.cmd("cnoreabbrev x Approve")
vim.cmd("cnoreabbrev q Cancel")

for _, buf in ipairs({ original_buf, proposed_buf }) do
  vim.b[buf].disable_autoformat = true
  vim.keymap.set("n", "<Space>a", approve, { buffer = buf, silent = true, nowait = true })
  vim.keymap.set("n", "<Space>q", cancel, { buffer = buf, silent = true, nowait = true })
  vim.keymap.set("n", "ga", approve, { buffer = buf, silent = true, nowait = true })
  vim.keymap.set("n", "gq", cancel, { buffer = buf, silent = true, nowait = true })
  vim.keymap.set("n", "g?", show_help, { buffer = buf, silent = true, nowait = true })
  for _, win in ipairs(vim.fn.win_findbuf(buf)) do
    vim.wo[win].foldmethod = "diff"
    vim.wo[win].foldlevel = 0
  end
end

vim.api.nvim_create_autocmd("BufWritePost", {
  buffer = proposed_buf,
  callback = function()
    vim.fn.writefile({ "approve" }, decision)
    vim.cmd("qall!")
  end,
})
vim.api.nvim_create_autocmd("VimResized", {
  callback = function()
    vim.cmd("wincmd =")
  end,
})

vim.bo[original_buf].readonly = true
vim.bo[original_buf].modifiable = false
for _, win in ipairs(vim.fn.win_findbuf(original_buf)) do
  vim.wo[win].statusline = " ORIGINAL  " .. display_path .. " %=g? help  Space+a/ga approve  Space+q/gq cancel"
  if vim.fn.exists("+winbar") == 1 then
    vim.wo[win].winbar = "ORIGINAL  " .. display_path
  end
end

vim.bo[proposed_buf].readonly = false
vim.bo[proposed_buf].modifiable = true
vim.bo[proposed_buf].modified = true
for _, win in ipairs(vim.fn.win_findbuf(proposed_buf)) do
  vim.wo[win].statusline = " PROPOSED (editable)  " .. display_path .. " %=g? help  Space+a/ga approve  Space+q/gq cancel"
  if vim.fn.exists("+winbar") == 1 then
    vim.wo[win].winbar = "PROPOSED (editable)  " .. display_path
  end
  vim.api.nvim_set_current_win(win)
end

vim.cmd("diffupdate")
vim.cmd("wincmd =")
pcall(vim.cmd, "normal! ]czz")
