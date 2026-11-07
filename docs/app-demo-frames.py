"""Build phone-framed app screenshots and 16:9 demo slides for the OwnTheBlock pitch."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = Path("/mnt/c/Users/kaleb/AppData/Local/Temp/otbdemo")
OUT = Path("/mnt/c/Users/kaleb/Downloads/OwnTheBlock_App_Demo")
(OUT / "phones").mkdir(parents=True, exist_ok=True)

NAVY, GOLD, INK, MUTED, WHITE, MIST = (11, 35, 65), (179, 139, 45), (31, 41, 55), (93, 102, 120), (255, 255, 255), (241, 244, 248)
F = "/mnt/c/Windows/Fonts/"
def font(name, size): return ImageFont.truetype(F + name, size)
TITLE, BODY, BOLD, SMALL = font("cambriab.ttf", 64), font("arial.ttf", 28), font("arialbd.ttf", 28), font("arialbd.ttf", 20)

SCREEN_W, SCREEN_H = 896, 1940  # crop of the 2x screenshot: the 448px app column
STATUS = 104  # phone status bar added above the app


def phone(name: str) -> Image.Image:
    """Screenshot inside a black phone bezel with rounded corners and a camera island (RGBA)."""
    raw = Image.open(SRC / f"{name}.png").convert("RGB").crop((52, 0, 52 + SCREEN_W, SCREEN_H - STATUS))
    shot = Image.new("RGB", (SCREEN_W, SCREEN_H), NAVY)
    shot.paste(raw, (0, STATUS))
    sd = ImageDraw.Draw(shot)
    sd.text((96, STATUS // 2 + 6), "9:41", font=font("arialbd.ttf", 34), fill=WHITE, anchor="lm")
    bx = SCREEN_W - 150  # battery + signal
    sd.rounded_rectangle((bx + 62, STATUS // 2 - 10, bx + 112, STATUS // 2 + 18), 6, outline=WHITE, width=3)
    sd.rectangle((bx + 67, STATUS // 2 - 5, bx + 100, STATUS // 2 + 13), fill=WHITE)
    for k in range(4):
        sd.rectangle((bx + k * 11, STATUS // 2 + 14 - 7 * (k + 1), bx + k * 11 + 7, STATUS // 2 + 14), fill=WHITE)
    bez, r_out = 34, 150
    W, H = SCREEN_W + 2 * bez, SCREEN_H + 2 * bez
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W - 1, H - 1), r_out, fill=(17, 17, 19, 255))
    d.rounded_rectangle((6, 6, W - 7, H - 7), r_out - 6, outline=(60, 60, 66, 255), width=3)
    mask = Image.new("L", (SCREEN_W, SCREEN_H), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SCREEN_W - 1, SCREEN_H - 1), r_out - bez, fill=255)
    img.paste(shot, (bez, bez), mask)
    # status-bar safe area + camera island over the demo banner
    d.rounded_rectangle((W // 2 - 110, bez + 22, W // 2 + 110, bez + 82), 30, fill=(10, 10, 12, 255))
    return img


def with_shadow(p: Image.Image) -> Image.Image:
    pad = 60
    sh = Image.new("RGBA", (p.width + 2 * pad, p.height + 2 * pad), (0, 0, 0, 0))
    a = p.split()[3].point(lambda v: 90 if v else 0)
    blk = Image.new("RGBA", p.size, (0, 0, 0, 255))
    blk.putalpha(a)
    sh.paste(blk, (pad, pad + 18), blk)
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    sh.alpha_composite(p, (pad, pad))
    return sh


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur)
    return lines


def slide(fname, kicker, title, phones, captions, points):
    """1920x1080 slide: headline + up to 3 phones, each with a numbered caption, plus 3 bullet takeaways on the left."""
    S = Image.new("RGB", (1920, 1080), WHITE)
    d = ImageDraw.Draw(S)
    d.text((90, 70), kicker.upper(), font=SMALL, fill=(79, 124, 172))
    y = 110
    for line in wrap(d, title, TITLE, 640):
        d.text((90, y), line, font=TITLE, fill=NAVY); y += 76
    y += 30
    for i, (h, b) in enumerate(points):
        d.rounded_rectangle((90, y, 132, y + 42), 10, fill=NAVY)
        d.text((111, y + 21), str(i + 1), font=BOLD, fill=WHITE, anchor="mm")
        d.text((152, y + 4), h, font=BOLD, fill=INK)
        yy = y + 42
        for line in wrap(d, b, BODY, 560):
            d.text((152, yy), line, font=BODY, fill=MUTED); yy += 36
        y = yy + 34
    d.text((90, 1020), "OwnTheBlock  |  Demo with pretend money  |  Screens from the working app", font=font("arial.ttf", 20), fill=MUTED)
    # phones
    n = len(phones)
    area_x0, area_x1 = (760, 1860) if n == 3 else (820, 1840)
    slot = (area_x1 - area_x0) / n
    body_w = min(slot - 40, 430)  # phone body width (without shadow)
    for i, (name, cap) in enumerate(zip(phones, captions)):
        p = with_shadow(phone(name))
        scale = body_w / (p.width - 120)
        p = p.resize((int(p.width * scale), int(p.height * scale)), Image.LANCZOS)
        body_h = (p.height - int(120 * scale))
        cx = int(area_x0 + slot * (i + 0.5))
        top = max(30, (960 - body_h) // 2)
        S.paste(p, (cx - p.width // 2, top - int(60 * scale)), p)
        d.text((cx, top + body_h + 34), cap, font=BOLD, fill=NAVY, anchor="mm")
    S.save(OUT / fname, quality=95)
    print("wrote", OUT / fname)


if __name__ == "__main__":
    names = sorted(p.stem for p in SRC.glob("[01]*.png"))
    for n in names:
        with_shadow(phone(n)).save(OUT / "phones" / f"{n}.png")
    print("phones:", len(names))

    slide("1_Invest_from_10.png", "The app", "Own a piece of your block, from $10",
          ["01-welcome", "03-explore", "04-property"], ["Welcome", "Explore Greensboro", "Every house, with photos"],
          [("Pick a house near you", "Homes, businesses and a neighborhood fund around NC A&T and Bennett."),
           ("See the real numbers", "Rent, every expense, the yield and the risks, before you put in a dollar."),
           ("Refund if it misses", "If a raise doesn't hit its goal, everyone gets their money back automatically.")])
    slide("2_Invest_in_3_taps.png", "How investing works", "Invest in 3 taps, and know where every dollar is",
          ["04-property", "05-invest", "12-trace"], ["Choose", "Invest $10+", "Follow the money"],
          [("Choose a property", "Each raise shows its goal, progress and closing date."),
           ("Pick an amount", "From $10. Built-in limits keep first-time investors safe."),
           ("Track every step", "The Money Trail follows your dollars from escrow to the house and back as rent.")])
    slide("3_Get_paid_monthly.png", "Your portfolio", "Watch your money work: rent paid to you every month",
          ["02-home", "11-account"], ["Home: your portfolio", "Account: payouts and wallet"],
          [("One clear balance", "Portfolio value, gains over time and the homes you own, like a brokerage app."),
           ("Monthly rent income", "Your share of each month's rent is paid out. Claim it with one tap."),
           ("Honest labels", "Estimates are labeled as estimates. Pretend money is labeled as pretend.")])
    slide("4_Blockchain_you_can_check.png", "Why blockchain", "A blockchain tab that explains itself, and proves it",
          ["06-chain-how", "07-chain-use"], ["How it works", "How we use it"],
          [("Plain-English explainer", "What a blockchain is, in 4 steps, and why a bank database can't do this."),
           ("Our 5 smart contracts", "ID check, the raise, ownership tokens, two-key treasury, community votes."),
           ("Proof, not promises", "Real transactions from our contract run, including 6 times the code said no.")])
    slide("5_Learn_and_simulate.png", "Built for first-time investors", "Learn, practice, and see the impact on your block",
          ["08-simulator", "09-learn", "10-impact"], ["Block Simulator", "2-minute lessons", "Community impact"],
          [("Practice first", "The Block Simulator walks a house from boarded-up to paying rent."),
           ("Learn as you earn", "Short lessons on yield, risk, USDC and blockchain."),
           ("See the impact", "Dollars kept local, homes owned by the community, residents who are owners.")])
