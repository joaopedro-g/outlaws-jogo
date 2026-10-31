# OUTLAWS boss and loot art

Original integer pixel drawings, generated with Node built-ins. No external source art or dependencies.

Run `node tools/draw-era-bosses.cjs` from the project folder to reproduce all four sheets and this preview.

- Boss sheets: 768 x 144 px, 16 columns, 3 rows, 48 px cells. Rows are King Tyrant, SWAT Chief, Alien Emperor.
- Boss frames: walk down 0..2, left 3..5, right 6..8, up 9..11, attack 12..13, hit 14, fall 15. Idle aliases frame 0.
- Loot sheets: 576 x 288 px, 12 columns, 6 rows, 48 px cells. Rows are Common, Uncommon, Rare, Epic, Legendary, Mythic.
- Loot frames: closed 0, shake 1..3, crack 4..6, burst 7..9, reveal 10..11. Reveal contains only the open chest and light. Reward character is composed by the caller.
- Ground anchor: x 24, y 43. Reward composition anchor: x 24, y 26. Bounds for every cell are in the JSON files.
- Alpha is always 0 or 255. No blur, interpolation, text or gradients. Display with nearest-neighbor scaling.
- Classic uses longer faces, plate detail and muted earth, gold and steel colors. Arcade uses larger heads, saturated rank colors and outline #17182d.
- Preview: first three boss rows Classic, next three Arcade; columns down, left, up, attack anticipation, attack contact, fall. Last two rows show all six loot ranks closed and revealed.

Verification: the generator validates binary alpha on every cell. JSON SHA-256 values identify the deterministic PNG outputs.
