from typing import Literal

BIASES = [
    {
        "name": "Confirmation Bias",
        "description": "Favouring information that confirms what you already believe.",
        "definition": "Confirmation bias is the tendency to search for, favour, and recall information that supports your existing beliefs — while unconsciously discounting evidence that challenges them. It's not stubbornness; it's an automatic mental shortcut that affects even the most analytical thinkers. The result is that your views feel increasingly well-supported over time, even when the underlying evidence is mixed.",
    },
    {
        "name": "Anchoring Bias",
        "description": "Over-relying on the first piece of information you encounter.",
        "definition": "Anchoring bias is the tendency to rely too heavily on the first piece of information you receive when making a decision. That initial number, estimate, or framing — the anchor — shapes all your subsequent thinking, even when it's arbitrary or shouldn't be relevant. It's why the opening offer in a negotiation matters so much, and why first impressions are so hard to revise.",
    },
    {
        "name": "Availability Heuristic",
        "description": "Overweighting examples that come easily to mind.",
        "definition": "The availability heuristic is the tendency to judge how likely or common something is based on how easily an example comes to mind. Because recent, dramatic, or emotionally vivid events are easier to recall, we overestimate their frequency and probability. This is why people overestimate the risk of plane crashes and underestimate everyday hazards — the dramatic examples are simply more memorable.",
    },
    {
        "name": "Overconfidence Bias",
        "description": "Overestimating the accuracy of your own judgements.",
        "definition": "Overconfidence bias is the tendency to overestimate the accuracy of your own knowledge, forecasts, and abilities. Most people — including domain experts — believe their judgements are more reliable than they actually are. It manifests as overly narrow confidence intervals, underestimated timelines, and a tendency to act on conviction before the evidence warrants it.",
    },
    {
        "name": "Loss Aversion",
        "description": "Feeling losses more acutely than equivalent gains.",
        "definition": "Loss aversion is the tendency to feel the pain of losing something roughly twice as intensely as the pleasure of gaining something equivalent. It's not irrational to dislike losses — but when losses loom disproportionately large, they distort decisions: we hold onto failing positions too long, avoid necessary risks, and accept worse expected outcomes just to avoid the possibility of loss.",
    },
    {
        "name": "Sunk Cost Fallacy",
        "description": "Continuing a course of action because of past investment, not future value.",
        "definition": "The sunk cost fallacy is the tendency to continue investing time, money, or effort into something because of what has already been spent — rather than based on its future prospects. Past costs are unrecoverable regardless of what you do next. Yet they continue to pull decisions forward, turning what should be a forward-looking question into an emotional defence of past choices.",
    },
    {
        "name": "Halo Effect",
        "description": "Letting one positive trait colour your overall judgement of a person or thing.",
        "definition": "The halo effect is the tendency to let one positive impression of a person, brand, or idea colour your overall judgement of them. Attractiveness, confidence, or early success in one domain leads us to assume competence and virtue in unrelated areas. It's why charismatic leaders often escape scrutiny, and why strong first impressions are so difficult to revise even with contradictory evidence.",
    },
    {
        "name": "Framing Effect",
        "description": "Being swayed by how information is presented rather than what it says.",
        "definition": "The framing effect is the tendency to respond differently to the same information depending on how it's presented. A 90% survival rate and a 10% mortality rate are identical facts — but they don't feel the same. Whether data is framed as a gain or a loss, a percentage or a raw number, a risk or an opportunity, it meaningfully shifts the decisions that follow.",
    },
    {
        "name": "Status Quo Bias",
        "description": "Preferring the current state of affairs and resisting change.",
        "definition": "Status quo bias is a preference for the current state of affairs, leading people to resist change even when an alternative would be objectively better. The default option carries disproportionate weight simply because it's familiar and because any change introduces perceived risk. It's why organisations persist with outdated processes, and why 'do nothing' is so often the implicit winner in decisions.",
    },
    {
        "name": "Dunning-Kruger Effect",
        "description": "Overestimating your competence in areas where your knowledge is limited.",
        "definition": "The Dunning-Kruger effect describes how people with limited knowledge in a domain tend to overestimate their competence — while genuine experts often underestimate theirs. The core problem is metacognitive: the less you know, the less equipped you are to recognise what you don't know. It's why novices act with great confidence and why mastery tends to produce more caution, not less.",
    },
]

BIAS_NAMES = [b["name"] for b in BIASES]

# ---------------------------------------------------------------------------
# Hardcoded trader questions — one set of 4 per bias, day-trading context
# ---------------------------------------------------------------------------
TRADER_QUESTIONS: dict[str, list[dict]] = {
    "Confirmation Bias": [
        {
            "bias": "Confirmation Bias",
            "question": "You've held a long position in EUR/USD for two days. Non-farm payrolls come in stronger than expected — a bearish signal for your trade. Before deciding what to do, you open three news sites. What shapes what you read most carefully?",
            "options": {
                "A": "I try to read a balanced mix — bullish and bearish takes — before making any decision.",
                "B": "I focus on commentary that questions the data's reliability or argues it's already priced in.",
                "C": "I set the news aside and let price action tell me what to do over the next hour.",
                "D": "I read the headlines quickly and pay more attention to anything that supports staying long.",
            },
            "scoring": {"A": 0, "B": 3, "C": 1, "D": 2},
        },
        {
            "bias": "Confirmation Bias",
            "question": "You've entered a short on a tech stock after thorough research. The company announces a major partnership and the stock jumps 3%. How do you process the new information?",
            "options": {
                "A": "I assess whether the partnership materially changes my original thesis and act accordingly.",
                "B": "I assume the move is an overreaction — the fundamentals I identified haven't changed.",
                "C": "I reduce half my position to manage risk while I reassess the thesis.",
                "D": "I hold the trade but look primarily for evidence the reaction will fade.",
            },
            "scoring": {"A": 0, "B": 3, "C": 1, "D": 2},
        },
        {
            "bias": "Confirmation Bias",
            "question": "You have a bullish view on gold. A respected macro analyst publishes a detailed bearish note citing structural headwinds. What do you do with it?",
            "options": {
                "A": "I dismiss it — analysts are often wrong, and I've done my own research.",
                "B": "I skim it but spend more time reading bullish counterarguments I can find online.",
                "C": "I read it carefully — a credible opposing view deserves serious consideration.",
                "D": "I note the key risk points and check whether they affect my stop-loss placement.",
            },
            "scoring": {"A": 3, "B": 2, "C": 0, "D": 1},
        },
        {
            "bias": "Confirmation Bias",
            "question": "You're short GBP/USD and price has moved 40 pips against you. You open your trading app to review the situation. What do you do first?",
            "options": {
                "A": "I look at the chart objectively to see if the technical picture has changed.",
                "B": "I check news headlines and focus on anything that could explain the move as noise.",
                "C": "I review my stop-loss level and decide whether price action warrants exiting.",
                "D": "I look for a reason the move is temporary and my original thesis still holds.",
            },
            "scoring": {"A": 0, "B": 2, "C": 1, "D": 3},
        },
    ],

    "Anchoring Bias": [
        {
            "bias": "Anchoring Bias",
            "question": "You bought crude oil at $85 per barrel. It's now at $71 after a sustained downtrend, and analysis suggests the trend is still bearish. What drives your decision on when to exit?",
            "options": {
                "A": "My entry price is irrelevant — I exit based on current market conditions and my stop level.",
                "B": "I've set a stop at $69 — if that's hit, I exit regardless of my entry price.",
                "C": "I want to see it recover to at least $78 before reassessing whether to hold or exit.",
                "D": "I wait until price recovers closer to $82 before exiting — taking a full $14 loss feels unnecessary.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Anchoring Bias",
            "question": "A stock you're watching dropped from $180 six months ago to $105 today. You're considering going long. How does the historical high influence your analysis?",
            "options": {
                "A": "The previous high is irrelevant to current value — I assess fundamentals and current chart structure.",
                "B": "I consider $180 as a potential longer-term target if the bullish thesis plays out.",
                "C": "The drop from $180 makes $105 look like a bargain — that's compelling in itself.",
                "D": "I note the $180 level as a reference for potential resistance, but it doesn't drive my entry logic.",
            },
            "scoring": {"A": 0, "B": 2, "C": 3, "D": 1},
        },
        {
            "bias": "Anchoring Bias",
            "question": "You entered long at 1.2500 with a target of 1.2700. Price reaches 1.2650 and shows clear reversal signals — lower highs and a break of the short-term uptrend line. What do you do?",
            "options": {
                "A": "The reversal signals matter more than the remaining 50 pips — I take profit now.",
                "B": "I reduce by half and let the rest run to see if 1.2700 gets hit.",
                "C": "I trail my stop to 1.2620 to lock in most of the gain while giving the target a chance.",
                "D": "I hold — my target is 1.2700 and I don't want to leave 50 pips on the table.",
            },
            "scoring": {"A": 0, "B": 2, "C": 1, "D": 3},
        },
        {
            "bias": "Anchoring Bias",
            "question": "You review a recent trade where you lost 80 pips from a high of +50 pips, because you held waiting for your original target of +120 pips. How do you evaluate this?",
            "options": {
                "A": "The original target was based on solid analysis — I just needed more patience.",
                "B": "A well-reasoned target should be honoured — if it didn't hit, that's normal variance.",
                "C": "Targets are guidelines — I should adapt when price shows clear reversal signals at any level.",
                "D": "I should have had a trailing stop — the entry price and original target shouldn't anchor my exit.",
            },
            "scoring": {"A": 3, "B": 2, "C": 1, "D": 0},
        },
    ],

    "Availability Heuristic": [
        {
            "bias": "Availability Heuristic",
            "question": "Six weeks ago you experienced a sharp 250-pip adverse move in GBP/USD during a volatile session. You're now about to enter a similar setup ahead of a US economic release. How does that event affect your stop placement?",
            "options": {
                "A": "I review historical volatility around similar events statistically before setting my stop.",
                "B": "I add an extra 40–50 pips to my usual stop to account for the risk.",
                "C": "I reduce my position size to limit exposure, using my standard stop distance.",
                "D": "I widen my stop significantly — that kind of move can happen again at any time.",
            },
            "scoring": {"A": 0, "B": 2, "C": 1, "D": 3},
        },
        {
            "bias": "Availability Heuristic",
            "question": "A trader in your network recently blew up their account through overleveraging during a news event. You're setting your leverage for this week. How does their story affect your decision?",
            "options": {
                "A": "It doesn't change my approach — I already have defined leverage rules I follow consistently.",
                "B": "I review my own risk rules to confirm they're still appropriate, then trade normally.",
                "C": "I lower leverage slightly this week as a precaution, knowing I'm probably overreacting.",
                "D": "I temporarily reduce my leverage significantly — that story is a stark reminder of the risks.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Availability Heuristic",
            "question": "You're considering trading Japanese yen pairs for the first time. The most memorable yen story you know is a famous flash crash that moved prices hundreds of pips in seconds. How much does this influence your risk assessment?",
            "options": {
                "A": "I look at actual volatility data for yen pairs rather than calibrating to one dramatic event.",
                "B": "I factor in flash-crash risk and use wider stops, but I rely on data for typical volatility.",
                "C": "I set my position size smaller than normal given what I know about yen event risk.",
                "D": "The flash crash tells me yen pairs carry extreme tail risk — I'd trade with minimal size or avoid them.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Availability Heuristic",
            "question": "You've had five consecutive losing trades using a momentum strategy. Markets this week feel similar to last week when the strategy failed. How do you approach your next entry?",
            "options": {
                "A": "I evaluate the current setup on its own merits — five losses don't change a valid setup's probability.",
                "B": "I check whether market conditions have genuinely changed, then trade the setup if they haven't.",
                "C": "I trade the setup but reduce size — I'm less confident after the recent run of losses.",
                "D": "I skip entries this week entirely — my strategy clearly isn't working right now.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Overconfidence Bias": [
        {
            "bias": "Overconfidence Bias",
            "question": "You've closed seven consecutive profitable trades over the past two weeks. A new setup forms that meets your criteria. How does your recent run influence your approach?",
            "options": {
                "A": "I follow my standard risk rules — recent results don't change what each new trade deserves.",
                "B": "I maintain position size but feel comfortable skipping one of my usual confirmation criteria.",
                "C": "I trade slightly larger — recent results suggest my market read is particularly sharp right now.",
                "D": "I trade at full size and enter with stronger conviction than I normally would.",
            },
            "scoring": {"A": 0, "B": 2, "C": 1, "D": 3},
        },
        {
            "bias": "Overconfidence Bias",
            "question": "You've been trading for 18 months and your account is up 35% over the last six months. A friend asks how confident you are in your ability to read the market. What do you tell them?",
            "options": {
                "A": "I'm profitable, but predicting markets is inherently uncertain — my edge is in risk management, not prediction.",
                "B": "It's challenging, but with the right approach, consistency is achievable — I feel like I'm getting there.",
                "C": "I'm cautiously confident — six good months is encouraging but far too short to draw strong conclusions.",
                "D": "I'm fairly confident — my results speak for themselves and I've developed a real feel for the market.",
            },
            "scoring": {"A": 0, "B": 2, "C": 1, "D": 3},
        },
        {
            "bias": "Overconfidence Bias",
            "question": "You've successfully traded FX for a year. You notice crypto markets follow similar chart patterns. You consider adding crypto to your trading without dedicated study, reasoning that technical analysis transfers. What's your thinking?",
            "options": {
                "A": "Trading one market well doesn't transfer automatically — I study the new asset class first.",
                "B": "I start with a demo account in crypto for a few weeks before going live.",
                "C": "I'm aware crypto has quirks, but my experience gives me enough of a head start to trade small size live.",
                "D": "Technical analysis is universal — my chart-reading skills will carry over without much adjustment.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Overconfidence Bias",
            "question": "You review three months of your trading journal and find a strategy with a 68% win rate across 45 trades. How confident are you that this represents a genuine, repeatable edge?",
            "options": {
                "A": "45 trades is a starting point — I need several hundred trades across different market conditions to be confident.",
                "B": "It's encouraging, but I continue journalling at standard size until the sample is much larger.",
                "C": "I'm fairly confident — 68% over 45 trades is statistically meaningful enough to start scaling up.",
                "D": "A 68% win rate over 45 trades is strong — this is clearly a solid strategy I should be trading at full size.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Loss Aversion": [
        {
            "bias": "Loss Aversion",
            "question": "A long trade is down 1.5% — exactly at your pre-defined stop-loss level. The technical reason you placed the stop there is still valid. What do you do?",
            "options": {
                "A": "I exit — the stop was set for a reason and I follow it without exception.",
                "B": "I stay in but watch closely — if it drops another 10 pips I'll definitely exit.",
                "C": "I exit half and give the other half a little more room to recover.",
                "D": "I move the stop 15 pips lower — price might just be wicking before reversing.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Loss Aversion",
            "question": "You have two open positions. Trade A is up 2.5% and momentum is fading. Trade B is down 2.5% and appears to be stabilising near support. You need to free up margin. What do you close?",
            "options": {
                "A": "I close whichever has the weaker forward probability — current P&L doesn't determine the decision.",
                "B": "I close Trade B — better to stop the bleeding and let the winner run.",
                "C": "I close half of each — it feels like a more balanced approach to the situation.",
                "D": "I close Trade A — I've made a solid gain and don't want to give it back.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Loss Aversion",
            "question": "Your trading plan defines a maximum daily loss of 2%. You've hit it at 11am. A clear, high-quality setup then forms — one you'd normally take without hesitation. What do you do?",
            "options": {
                "A": "I don't take the trade — daily loss limits exist to protect me from myself on bad days.",
                "B": "I paper trade it to see how it plays out, but don't risk real capital.",
                "C": "I take it at half my normal size — if I miss it I'll be more frustrated than if I lose.",
                "D": "I take it at reduced size — this one looks too good to pass up, and I'll make back the loss.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Loss Aversion",
            "question": "A trade hits your target and closes at +80 pips profit. The move then continues for another 120 pips after your exit. How do you respond emotionally and operationally?",
            "options": {
                "A": "A trade that hit its target is a success — I don't dwell on what happened after my exit.",
                "B": "I review whether the exit criteria were sound, but if they were, I accept the outcome.",
                "C": "I adjust my targets upward for similar setups to try to capture more of the move next time.",
                "D": "I feel I left significant money on the table and consider holding longer in the future.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Sunk Cost Fallacy": [
        {
            "bias": "Sunk Cost Fallacy",
            "question": "You entered a long on a commodity based on a supply-shortage thesis. Three weeks later, the shortage has been resolved by an unexpected supply agreement. Your position is down £1,800. What do you do?",
            "options": {
                "A": "My thesis is gone — I exit the position regardless of the loss.",
                "B": "I re-examine all the facts carefully to make sure the thesis is truly dead before exiting.",
                "C": "I reduce my position by half now and set a tighter stop on the rest.",
                "D": "I've already lost £1,800 — I hold until it recovers at least partially before exiting.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Sunk Cost Fallacy",
            "question": "You spent two weeks studying a trade setup across multiple timeframes. The entry trigger never formed, and four weeks later conditions have changed — the setup is no longer valid. What do you do?",
            "options": {
                "A": "The setup expired — I move on and look for new opportunities without hesitation.",
                "B": "I close my notebook on this one but keep watching in case a related opportunity emerges.",
                "C": "I look for a slightly different entry to justify the research — it feels wrong to abandon it entirely.",
                "D": "I look for any angle that still makes the original trade viable — two weeks of work deserves a chance.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Sunk Cost Fallacy",
            "question": "You're down £3,200 on a short trade. Price has rallied to a key resistance level and is starting to stall. Your original short thesis is still intact. Do you add to the position?",
            "options": {
                "A": "The decision to add should depend entirely on the quality of the current setup — not on recovering losses.",
                "B": "I wouldn't add — being down heavily clouds judgement and makes averaging down dangerous.",
                "C": "I'd add a small amount at this level since the technicals support it, while acknowledging the risk.",
                "D": "Adding here makes sense — if it works, I recover the loss faster and the thesis is still valid.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Sunk Cost Fallacy",
            "question": "You've been trading a strategy for four months — net negative across 60+ live trades. You spent significant time optimising it from backtests. What do you do now?",
            "options": {
                "A": "60+ live trades is enough data — if it's not working, I retire the strategy and move on.",
                "B": "I pause live trading and go back to backtesting to find where the edge has broken down.",
                "C": "I reduce position size significantly and trade it lightly while I reassess over another month.",
                "D": "I give it another two or three months — I've invested too much time to abandon it without more data.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Halo Effect": [
        {
            "bias": "Halo Effect",
            "question": "A well-known trader you follow — who made headlines with a 300% return last year — publicly posts a long trade on EUR/JPY. You weren't planning to trade that pair today. What do you do?",
            "options": {
                "A": "Their post doesn't affect my trading plan — I don't know their position size, stop, or timeframe.",
                "B": "I research the trade myself — if I agree with the thesis after my own analysis, I take it.",
                "C": "I take the trade at reduced size — their track record means their calls carry real weight.",
                "D": "I enter the trade — their 300% return last year tells me they're seeing something in this market.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Halo Effect",
            "question": "A famous macro hedge fund known for excellence releases its quarterly holdings. They've added a large position in gold. You're currently neutral on gold. How does this affect you?",
            "options": {
                "A": "I note it as one data point but don't change my view without my own analysis supporting it.",
                "B": "I research the macro case for gold to see if their reasoning aligns with my own framework.",
                "C": "Their positioning is a meaningful signal — I take a small position and monitor their next moves.",
                "D": "A fund of that calibre clearly sees something — I add gold exposure to my own portfolio.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Halo Effect",
            "question": "An analyst who correctly called the 2020 market crash is now warning of a 30% equity correction within six months. How much weight do you give this call?",
            "options": {
                "A": "One correct prediction — even a major one — doesn't make someone reliably right about the future.",
                "B": "I read the report carefully to understand the reasoning, then form my own independent view.",
                "C": "Their track record earns them more attention than the average analyst — I treat it as a meaningful signal.",
                "D": "Getting 2020 right was significant — I reduce my equity exposure and take the warning seriously.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Halo Effect",
            "question": "You're about to take a trade that your own analysis supports. A trader you deeply respect publicly disagrees with the direction. What do you do?",
            "options": {
                "A": "I take the trade — my analysis is my analysis. I note their view as a risk factor, but I trust my process.",
                "B": "I re-examine my reasoning specifically looking for what I might have missed.",
                "C": "I take the trade at reduced size to acknowledge the risk of someone credible being on the other side.",
                "D": "I don't take the trade — if someone that experienced sees it differently, there's probably a reason.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Framing Effect": [
        {
            "bias": "Framing Effect",
            "question": "You're evaluating two trading systems. System A has a '72% win rate.' System B 'loses on 28% of trades.' Given only this information, which feels more appealing — and how much does the framing affect your thinking?",
            "options": {
                "A": "They're identical — framing doesn't change how I evaluate a strategy's merit.",
                "B": "I'm aware it's the same data presented differently, though I notice System A sounds more attractive.",
                "C": "I know they're the same but System A still feels easier to trade psychologically.",
                "D": "System A sounds clearly better — a 72% win rate is what I'm looking for in a strategy.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Framing Effect",
            "question": "Your broker sends two performance summaries for the same month. Report A says 'Your account grew by £1,200.' Report B says 'Your account returned 4%.' Do these feel the same to you?",
            "options": {
                "A": "Yes — I always evaluate performance as a percentage of capital, not as an absolute number.",
                "B": "I prefer the percentage — it tells me more about the quality of the result relative to risk taken.",
                "C": "They feel slightly different, though I know they're equivalent — cash feels more tangible.",
                "D": "The £1,200 feels more real and motivating — I primarily think about P&L in cash terms.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Framing Effect",
            "question": "Two traders describe the same trade differently. Trader A says: 'There's a 20% chance this loses.' Trader B says: 'This wins 80% of the time.' Does this affect how you feel about taking it?",
            "options": {
                "A": "No — 20% loss rate and 80% win rate describe the same trade. I focus on expected value.",
                "B": "I'd verify both are describing the exact same trade — framing differences sometimes hide important detail.",
                "C": "They're the same, but I notice Trader B's version makes me feel more comfortable about the trade.",
                "D": "Trader B's framing makes me genuinely more willing to take it — it affects how I think about the risk.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Framing Effect",
            "question": "Two strategies have identical expected value. Strategy A is described as 'high win rate, small losses.' Strategy B is described as 'frequent small losses, occasional large wins.' Which do you lean toward?",
            "options": {
                "A": "I choose based on statistics and execution fit — both have the same expected value, so I focus on which I can trade consistently.",
                "B": "I'd want to see the full return distribution of both before deciding — the summary descriptions don't tell me enough.",
                "C": "Strategy A — frequent losses affect my decision-making even when I know the math is equivalent.",
                "D": "Strategy A — I find frequent losses genuinely difficult to sit through even if the long-run outcome is equal.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Status Quo Bias": [
        {
            "bias": "Status Quo Bias",
            "question": "Your momentum strategy has worked well in trending markets but has had consistent losses over the past six weeks as markets have turned choppy. What do you do?",
            "options": {
                "A": "Choppy markets call for a different approach — I adapt my strategy or step back and wait.",
                "B": "I reduce position size significantly and only trade the clearest setups while conditions are poor.",
                "C": "I make small adjustments to entry criteria to try to filter out the noise in the ranging market.",
                "D": "Markets always cycle — I stick with my strategy and wait for the trend to return.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Status Quo Bias",
            "question": "Your broker offers a switch to a platform with demonstrably tighter spreads and faster execution — significant advantages for your trading style. The migration takes about half a day. What do you do?",
            "options": {
                "A": "I switch — tighter spreads and better execution directly improve my bottom line.",
                "B": "I demo the new platform for a few weeks before committing to the switch.",
                "C": "I switch eventually but keep putting it off — the current setup works well enough for now.",
                "D": "I stay — I know my current platform well and changing introduces unknowns I'd rather avoid.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Status Quo Bias",
            "question": "A backtested indicator you've never used consistently outperforms your current indicator across three years of data and multiple market conditions. What do you do?",
            "options": {
                "A": "The data is compelling — I forward-test it on a demo account and plan to integrate it if it holds up.",
                "B": "I add it as a secondary filter alongside my current indicator to see how it performs live.",
                "C": "I study it further before making any changes — it might just be curve-fitted to the backtest period.",
                "D": "I know my current indicator well — I don't want to change something that's working for me.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Status Quo Bias",
            "question": "You've been trading the same pairs at the same session times for two years. Analysis shows that a different session offers statistically better opportunities for your strategy. What do you do?",
            "options": {
                "A": "I test the new session with a small account to see whether the data holds up in practice.",
                "B": "I consider it seriously and run a paper trading test before committing to any change.",
                "C": "I gradually shift session times over a few weeks to ease the transition.",
                "D": "I keep trading the same session — I know how these markets behave and I'm not convinced by statistics alone.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],

    "Dunning-Kruger Effect": [
        {
            "bias": "Dunning-Kruger Effect",
            "question": "You've been trading for eight months and your account is up 28%. A friend asks if trading is genuinely as hard as people say. What's your honest answer?",
            "options": {
                "A": "Yes — I've had a good run but I'm under no illusion about how much I still don't know.",
                "B": "It's difficult, and eight months of gains don't mean much — I've probably just had favourable conditions.",
                "C": "It's challenging, but with the right approach, consistency is achievable — I feel like I'm getting there.",
                "D": "It's hard to start, but once you understand the basics it becomes more manageable than people think.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Dunning-Kruger Effect",
            "question": "After three months of profitable trading you start considering quitting your job to trade full-time. How do you evaluate your readiness?",
            "options": {
                "A": "Three months is nowhere near enough — I'd want at least 2–3 years of consistent results across different market conditions.",
                "B": "I'm encouraged but I'd want 12–18 months of solid performance before making that kind of decision.",
                "C": "My results are promising, and with the time to focus properly I think the step up makes sense.",
                "D": "Three good months show I have what it takes — with full-time focus I could really accelerate.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Dunning-Kruger Effect",
            "question": "You've developed a strategy that produced strong returns during a sustained bull trend in equities. How confident are you that it will perform across different market conditions?",
            "options": {
                "A": "Not confident at all without testing it through a bear market, a sideways period, and a high-volatility phase.",
                "B": "Cautiously optimistic — I know I need to see how it handles conditions it wasn't designed for.",
                "C": "Reasonably confident — I've backtested across different periods and it holds up well historically.",
                "D": "The fundamentals of the strategy are sound — strong trends are normal and it should hold up in most conditions.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
        {
            "bias": "Dunning-Kruger Effect",
            "question": "You review your trading journal and find your analysis hit the correct market direction on 7 out of the last 10 trades. How do you interpret this?",
            "options": {
                "A": "10 trades is too small a sample — directional accuracy alone also says nothing about profitability or risk-adjusted returns.",
                "B": "Interesting, but I focus on P&L and risk-adjusted returns rather than directional accuracy.",
                "C": "It's encouraging — I'll track this over the next 50 trades to see if it's a genuine pattern.",
                "D": "A 70% directional accuracy rate is excellent — it confirms I'm reading the market well.",
            },
            "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
        },
    ],
}

Level = Literal["Low", "Medium", "High"]


def build_single_bias_prompt(bias: str, role: str = "entrepreneur") -> str:
    if role == "trader":
        return f"""You are a behavioural psychologist designing a cognitive bias assessment for active day traders (FX, CFD, stocks, crypto).

Generate exactly 4 multiple-choice questions that test "{bias}".

Requirements:
- All 4 questions must specifically probe "{bias}" — but subtly, without naming it
- Use realistic day-trading scenarios: position management, stop losses, P&L reactions, following other traders, news events, leverage decisions, strategy changes
- All 4 options (A-D) must sound equally reasonable to an experienced trader
- Questions must be subtle — do NOT signal what bias is being tested
- Avoid textbook-style or obvious bias questions
- Use non-linear scoring (0–3 per question, where 3 = strongest bias expression)
- The 4 questions should cover meaningfully different scenarios

Output ONLY a valid JSON array of exactly 4 objects — no markdown, no explanation, no extra text:
[
  {{
    "bias": "{bias}",
    "question": "...",
    "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
    "scoring": {{ "A": 2, "B": 0, "C": 3, "D": 1 }}
  }}
]"""

    return f"""You are a behavioural psychologist designing a cognitive bias assessment for experienced professionals (founders, executives, investors).

Generate exactly 4 multiple-choice questions that test "{bias}".

Requirements:
- All 4 questions must specifically probe "{bias}" — but subtly, without naming it
- Use senior decision-making scenarios: hiring/promotion, strategy, capital allocation, risk, board dynamics, evaluating people or data
- All 4 options (A-D) must sound equally reasonable and defensible to a senior professional
- Questions must be subtle — do NOT signal what bias is being tested
- Avoid textbook-style or obvious bias questions
- Use non-linear scoring (0–3 per question, where 3 = strongest bias expression)
- Occasionally invert expected patterns so that more "analytical" answers are not always lower-bias
- The 4 questions should cover meaningfully different scenarios

Output ONLY a valid JSON array of exactly 4 objects — no markdown, no explanation, no extra text:
[
  {{
    "bias": "{bias}",
    "question": "...",
    "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
    "scoring": {{ "A": 2, "B": 0, "C": 3, "D": 1 }}
  }}
]"""


def build_summary_analysis_prompt(bias: str, total_score: int, level: str) -> str:
    return f"""You are a behavioural psychologist. A professional has just completed a 4-question assessment and scored {total_score} out of 12 on {bias}, placing them in the {level} range (Low = 0–4, Medium = 5–8, High = 9–12).

Write exactly one short paragraph — no headers, no bullets, plain English:

What does a {level} score mean in practice for this person? Be specific about how this level of {bias} shows up in the decisions and behaviour of a senior professional. Under 3 sentences. Speak directly to the reader (use "you" and "your").

No headers. No bullets. Plain prose only."""


def build_single_bias_analysis_prompt(
    bias: str,
    total_score: int,
    level: str,
    questions: list[dict],
) -> str:
    def _fmt_question(q: dict) -> str:
        opts = " | ".join(f"{k}) {v}" for k, v in q["options"].items())
        chosen_text = q["options"][q["answer_given"]]
        return (
            f"Question {q['number']}: \"{q['question']}\"\n"
            f"  Options: {opts}\n"
            f"  Answer given: {q['answer_given']} — \"{chosen_text}\"\n"
            f"  Score for this answer: {q['question_score']} out of 3"
        )

    question_detail = "\n\n".join(_fmt_question(q) for q in questions)

    return f"""You are a behavioural psychologist writing a short, plain-English analysis for a professional who just completed a 4-question assessment on {bias}.

Their total score was {total_score} out of 12, which places them in the {level} range (Low = 0–4, Medium = 5–8, High = 9–12).

Here are the 4 questions, the answer they chose, and the score that answer received (higher score = stronger expression of the bias):

{question_detail}

Write a clear, natural explanation in three short paragraphs. Do not use headers, bullet points, or markdown formatting. Write in plain prose as if speaking directly to the person.

Paragraph 1: Tell them their result — the score, what {level} means for {bias} in plain terms, and what it typically looks like in the day-to-day decisions of a senior professional. Be concrete, not abstract.

Paragraph 2: Point to the specific question or questions where the bias showed up most clearly (score 2 or 3). Describe what they chose and explain in plain language why that response reflects {bias}. Be precise — quote or closely paraphrase their answer. If all scores were 0 or 1, say so and note which question came closest.

Paragraph 3: One or two sentences on what someone with this pattern might want to watch for in real decisions. Keep it practical and direct — no coaching clichés, no motivational language.

Write as if you are a trusted colleague giving honest, useful feedback. Avoid jargon. Use plain English throughout."""
