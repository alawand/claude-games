; =====================================================================
;  C64 SNAKE  -  6510 assembly, ACME syntax
;  Plug a joystick into PORT 2  (in VICE: numpad, RCtrl = fire)
;
;  Build:  acme -f cbm -o snake.prg snake.asm
;  Run:    x64sc snake.prg     (or LOAD"SNAKE",8,1 : RUN on real iron)
; =====================================================================

!to "snake.prg", cbm

; ---- hardware / kernal locations ------------------------------------
SCREEN   = $0400          ; 40x25 screen RAM
COLRAM   = $d800          ; color RAM (screen + $D400)
JOY2     = $dc00          ; CIA#1 port A = joystick port 2 (active low)
CIA_DDRA = $dc02
VIC_BORD = $d020
VIC_BG   = $d021
RASTER   = $d012

; ---- screen codes / colors ------------------------------------------
SPACE    = $20
BLOCK    = $a0            ; solid block: used for BOTH walls and snake
FOOD     = $51            ; filled circle
COL_WHITE  = $01
COL_GREEN  = $05
COL_YELLOW = $07
COL_GRAY   = $0c

; ---- direction codes (opposite = dir EOR 1) -------------------------
DIR_UP    = 0
DIR_DOWN  = 1
DIR_LEFT  = 2
DIR_RIGHT = 3

; ---- zero page pointers ---------------------------------------------
ptr   = $fb              ; $fb/$fc  general screen pointer
; (we reuse ptr for color too by adding $D4 to its hi byte)

; ---- game variables (free RAM block at $C000) -----------------------
direction = $c000
newdir    = $c001
headLo    = $c002
headHi    = $c003
newLo     = $c004
newHi     = $c005
headIdx   = $c006
tailIdx   = $c007
foodLo    = $c008
foodHi    = $c009
rndseed   = $c00a
speed     = $c00b
foodX     = $c00c
foodY     = $c00d
segLo     = $c100        ; ring buffer of body cell addresses (256 each)
segHi     = $c200

; =====================================================================
;  BASIC autostart stub:  10 SYS 2061
; =====================================================================
*=$0801
        !byte $0c,$08,$0a,$00,$9e
        !text "2061"
        !byte $00,$00,$00

*=$080d
; ---------------------------------------------------------------------
start
        sei                      ; we own the machine: no kernal IRQ
        lda #$00
        sta CIA_DDRA             ; port A all inputs -> read joystick 2
        sta VIC_BORD
        sta VIC_BG               ; black border + background
        jsr titleScreen
        jmp newgame

; =====================================================================
;  TITLE SCREEN
; =====================================================================
titleScreen
        jsr clearScreen
        lda #<msgTitle
        sta $fd
        lda #>msgTitle
        sta $fe
        lda #<(SCREEN + 8*40 + 15)
        sta ptr
        lda #>(SCREEN + 8*40 + 15)
        sta ptr+1
        jsr printStr

        lda #<msgSub
        sta $fd
        lda #>msgSub
        sta $fe
        lda #<(SCREEN + 10*40 + 13)
        sta ptr
        lda #>(SCREEN + 10*40 + 13)
        sta ptr+1
        jsr printStr

        lda #<msgFire
        sta $fd
        lda #>msgFire
        sta $fe
        lda #<(SCREEN + 13*40 + 10)
        sta ptr
        lda #>(SCREEN + 13*40 + 10)
        sta ptr+1
        jsr printStr

        lda #<msgPort
        sta $fd
        lda #>msgPort
        sta $fe
        lda #<(SCREEN + 15*40 + 11)
        sta ptr
        lda #>(SCREEN + 15*40 + 11)
        sta ptr+1
        jsr printStr

        ; wait for FIRE, stirring the RNG by the time it takes
tw_wait
        inc rndseed
        lda JOY2
        and #$10
        bne tw_wait              ; bit4=0 -> fire pressed
tw_rel
        lda JOY2
        and #$10
        beq tw_rel               ; wait release (debounce)
        rts

; =====================================================================
;  NEW GAME  (also the restart entry)
; =====================================================================
newgame
        jsr clearScreen

        ; "SCORE" label + 000 on row 0
        ldx #0
ng_lbl  lda scoreLbl,x
        beq ng_lbldone
        sta SCREEN+1,x
        inx
        bne ng_lbl
ng_lbldone
        lda #$30
        sta SCREEN+7
        sta SCREEN+8
        sta SCREEN+9

        jsr drawBorder

        ; initial state: moving right, length 4, centered (row 12)
        lda #DIR_RIGHT
        sta direction
        sta newdir
        lda #8
        sta speed

        ; row 12 base = $05E0 ; cols 17..20
        lda #$f1            ; $05F1 = (12,17)
        sta segLo+0
        lda #$05
        sta segHi+0
        lda #$f2
        sta segLo+1
        lda #$05
        sta segHi+1
        lda #$f3
        sta segLo+2
        lda #$05
        sta segHi+2
        lda #$f4            ; $05F4 = (12,20) head
        sta segLo+3
        lda #$05
        sta segHi+3
        lda #3
        sta headIdx
        lda #0
        sta tailIdx
        lda #$f4
        sta headLo
        lda #$05
        sta headHi

        ; draw the four start segments
        ldx #0
ng_draw lda segLo,x
        sta ptr
        lda segHi,x
        sta ptr+1
        ldy #0
        lda #BLOCK
        sta (ptr),y
        lda segHi,x
        clc
        adc #$d4
        sta ptr+1
        lda #COL_GREEN
        sta (ptr),y
        inx
        cpx #4
        bne ng_draw

        ; seed RNG (nonzero) + drop first food
        lda RASTER
        ora #$01
        sta rndseed
        jsr placeFood

; =====================================================================
;  MAIN LOOP  -  wait 'speed' frames, then one game tick
; =====================================================================
mainloop
        ldx speed
ml_wait jsr vsync
        dex
        bne ml_wait

        lda #$10                 ; release any sound from last tick
        sta $d404

        jsr readJoy
        lda newdir
        sta direction
        jsr step
        jmp mainloop

; =====================================================================
;  STEP : advance one cell, handle eat / move / die
; =====================================================================
step
        ; new head = head + delta[direction]   (16-bit)
        ldx direction
        clc
        lda headLo
        adc deltaLo,x
        sta newLo
        lda headHi
        adc deltaHi,x
        sta newHi

        ; if new cell == current tail cell, it's a legal move
        ; (the tail will vacate this tick), so skip the death check
        ldx tailIdx
        lda newLo
        cmp segLo,x
        bne st_check
        lda newHi
        cmp segHi,x
        bne st_check
        jsr eraseTail
        jsr addHead
        rts

st_check
        lda newLo
        sta ptr
        lda newHi
        sta ptr+1
        ldy #0
        lda (ptr),y              ; what's in the target cell?
        cmp #FOOD
        beq st_eat
        cmp #SPACE
        beq st_move
        jmp gameOver             ; anything else (block) = death

st_move
        jsr eraseTail
        jsr addHead
        rts

st_eat
        jsr addHead              ; grow: head added, tail kept
        jsr addScore
        jsr rampSpeed
        jsr beep
        jsr placeFood
        rts

; ---------------------------------------------------------------------
addHead
        inc headIdx
        ldx headIdx
        lda newLo
        sta segLo,x
        sta headLo
        lda newHi
        sta segHi,x
        sta headHi
        ; draw block + green
        lda newLo
        sta ptr
        lda newHi
        sta ptr+1
        ldy #0
        lda #BLOCK
        sta (ptr),y
        lda newHi
        clc
        adc #$d4
        sta ptr+1
        lda #COL_GREEN
        sta (ptr),y
        rts

; ---------------------------------------------------------------------
eraseTail
        ldx tailIdx
        lda segLo,x
        sta ptr
        lda segHi,x
        sta ptr+1
        ldy #0
        lda #SPACE
        sta (ptr),y
        inc tailIdx
        rts

; =====================================================================
;  READ JOYSTICK (port 2, active low) -> set newdir, no 180s
; =====================================================================
readJoy
        lda JOY2
        sta foodX_tmp            ; scratch (reuse a byte we don't need now)
        and #$01                 ; up
        bne rj_nu
        lda #DIR_UP
        jsr tryDir
rj_nu
        lda foodX_tmp
        and #$02                 ; down
        bne rj_nd
        lda #DIR_DOWN
        jsr tryDir
rj_nd
        lda foodX_tmp
        and #$04                 ; left
        bne rj_nl
        lda #DIR_LEFT
        jsr tryDir
rj_nl
        lda foodX_tmp
        and #$08                 ; right
        bne rj_nr
        lda #DIR_RIGHT
        jsr tryDir
rj_nr
        rts

tryDir                           ; A = candidate direction
        sta cand
        lda direction
        eor #$01                 ; opposite of current
        cmp cand
        beq tryDir_x             ; candidate is a reversal -> ignore
        lda cand
        sta newdir
tryDir_x
        rts

; =====================================================================
;  SCORE : bump 3 on-screen digits with carry
; =====================================================================
addScore
        inc SCREEN+9
        lda SCREEN+9
        cmp #$3a
        bne as_done
        lda #$30
        sta SCREEN+9
        inc SCREEN+8
        lda SCREEN+8
        cmp #$3a
        bne as_done
        lda #$30
        sta SCREEN+8
        inc SCREEN+7
as_done
        rts

rampSpeed
        lda speed
        cmp #4
        bcc rs_done
        beq rs_done
        dec speed
rs_done
        rts

; =====================================================================
;  SID blip
; =====================================================================
beep
        lda #$0f
        sta $d418                ; volume
        lda #$00
        sta $d406                ; sustain/release = 0
        lda #$f9
        sta $d405                ; attack/decay = fast
        lda #$00
        sta $d400
        lda #$30
        sta $d401                ; frequency
        lda #$11
        sta $d404                ; triangle + gate on
        rts

; =====================================================================
;  RNG : 8-bit Galois LFSR ($1d), period 255, never 0
; =====================================================================
nextRnd
        lda rndseed
        asl
        bcc nr_nz
        eor #$1d
nr_nz
        sta rndseed
        rts

; =====================================================================
;  PLACE FOOD at a random empty interior cell (cols 1..38, rows 2..23)
; =====================================================================
placeFood
pf_x    jsr nextRnd
        lda rndseed
        and #$3f
        cmp #1
        bcc pf_x
        cmp #39
        bcs pf_x
        sta foodX
pf_y    jsr nextRnd
        lda rndseed
        and #$1f
        cmp #2
        bcc pf_y
        cmp #24
        bcs pf_y
        sta foodY
        ; addr = rowLo[Y] + X
        ldy foodY
        clc
        lda rowLo,y
        adc foodX
        sta newLo
        lda rowHi,y
        adc #0
        sta newHi
        ; must be empty
        lda newLo
        sta ptr
        lda newHi
        sta ptr+1
        ldy #0
        lda (ptr),y
        cmp #SPACE
        bne pf_x
        ; draw food + yellow
        lda #FOOD
        sta (ptr),y
        lda newHi
        clc
        adc #$d4
        sta ptr+1
        lda #COL_YELLOW
        sta (ptr),y
        lda newLo
        sta foodLo
        lda newHi
        sta foodHi
        rts

; =====================================================================
;  GAME OVER -> wait FIRE -> restart
; =====================================================================
gameOver
        lda #$02
        sta VIC_BORD             ; flash border red
        jsr clearScreen
        lda #<msgOver
        sta $fd
        lda #>msgOver
        sta $fe
        lda #<(SCREEN + 11*40 + 15)
        sta ptr
        lda #>(SCREEN + 11*40 + 15)
        sta ptr+1
        jsr printStr
        lda #<msgRetry
        sta $fd
        lda #>msgRetry
        sta $fe
        lda #<(SCREEN + 13*40 + 10)
        sta ptr
        lda #>(SCREEN + 13*40 + 10)
        sta ptr+1
        jsr printStr
go_wait lda JOY2
        and #$10
        bne go_wait
go_rel  lda JOY2
        and #$10
        beq go_rel
        lda #$00
        sta VIC_BORD
        jmp newgame

; =====================================================================
;  VSYNC : one frame (wait for raster to pass line 255)
; =====================================================================
vsync
vs_a    lda RASTER
        cmp #$ff
        beq vs_a
vs_b    lda RASTER
        cmp #$ff
        bne vs_b
        rts

; =====================================================================
;  CLEAR SCREEN : spaces + white, exactly 1000 cells
; =====================================================================
clearScreen
        ldx #0
cs_l    lda #SPACE
        sta SCREEN+$000,x
        sta SCREEN+$100,x
        sta SCREEN+$200,x
        sta SCREEN+$2e8,x
        lda #COL_WHITE
        sta COLRAM+$000,x
        sta COLRAM+$100,x
        sta COLRAM+$200,x
        sta COLRAM+$2e8,x
        inx
        bne cs_l
        rts

; =====================================================================
;  DRAW BORDER : box around rows 1..24, gray
; =====================================================================
drawBorder
        ; top row 1 and bottom row 24, full width
        ldx #0
db_h    lda #BLOCK
        sta SCREEN + 1*40,x      ; row 1
        sta SCREEN + 24*40,x     ; row 24
        lda #COL_GRAY
        sta COLRAM + 1*40,x
        sta COLRAM + 24*40,x
        inx
        cpx #40
        bne db_h
        ; left col 0 + right col 39 for rows 1..24
        ldx #1
db_v    txa
        tay
        lda rowLo,y
        sta ptr
        lda rowHi,y
        sta ptr+1
        ldy #0
        lda #BLOCK
        sta (ptr),y
        ldy #39
        sta (ptr),y
        lda ptr+1
        clc
        adc #$d4
        sta ptr+1
        ldy #0
        lda #COL_GRAY
        sta (ptr),y
        ldy #39
        sta (ptr),y
        inx
        cpx #25
        bne db_v
        rts

; =====================================================================
;  PRINT STRING : $fd/$fe = PETSCII source, ptr = screen dest
;  (color already white from clearScreen)
; =====================================================================
printStr
        ldy #0
ps_l    lda ($fd),y
        beq ps_done
        jsr petToScreen
        sta (ptr),y
        iny
        bne ps_l
ps_done
        rts

petToScreen                      ; A in -> screen code out
        cmp #$40
        bcc pts_done
        and #$3f
pts_done
        rts

; =====================================================================
;  DELTA TABLES (per direction): screen-address offset, 16-bit signed
;  up=-40($FFD8) down=+40($0028) left=-1($FFFF) right=+1($0001)
; =====================================================================
deltaLo !byte $d8,$28,$ff,$01
deltaHi !byte $ff,$00,$ff,$00

; row base addresses: SCREEN + row*40, rows 0..24
rowLo
!for r, 0, 24 { !byte <(SCREEN + r*40) }
rowHi
!for r, 0, 24 { !byte >(SCREEN + r*40) }

; ---- text (PETSCII, converted at print time) ------------------------
scoreLbl !byte $13,$03,$0f,$12,$05,$00     ; "SCORE" pre-encoded
msgTitle !text "C64 SNAKE",0
msgSub   !text "ASSEMBLY 6510",0
msgFire  !text "PRESS FIRE TO START",0
msgPort  !text "JOYSTICK IN PORT 2",0
msgOver  !text "GAME OVER",0
msgRetry !text "PRESS FIRE TO RETRY",0

; ---- scratch bytes --------------------------------------------------
cand      !byte 0
foodX_tmp !byte 0
