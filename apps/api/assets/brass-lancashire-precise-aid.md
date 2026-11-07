# Brass: Lancashire precise aid

## Turn order

1. Collect income.
2. Play two actions (only 1 in the first round).
3. Determine player order (least money spent goes first).
4. Refill hand.

## Industry tiles

| Industry    | Tech level | Cost | Income | VPs | Coal? | Iron? | Period     | No. | Cubes |
| ----------- | ---------- | ---- | ------ | --- | ----- | ----- | ---------- | --- | ----- |
| Cotton Mill | 1          | 12   | 5      | 3   |       |       | Canal only | 3   |       |
| Cotton Mill | 2          | 14   | 4      | 5   | Y     |       | Both       | 3   |       |
| Cotton Mill | 3          | 16   | 3      | 9   | Y     | Y     | Both       | 3   |       |
| Cotton Mill | 4          | 18   | 2      | 12  | Y     | Y     | Both       | 3   |       |
| Port        | 1          | 6    | 3      | 2   |       |       | Canal only | 2   |       |
| Port        | 2          | 7    | 3      | 4   |       |       | Both       | 2   |       |
| Port        | 3          | 8    | 4      | 6   |       |       | Both       | 2   |       |
| Port        | 4          | 9    | 4      | 9   |       |       | Both       | 2   |       |
| Coal Mine   | 1          | 5    | 4      | 1   |       |       | Canal only | 1   | 2     |
| Coal Mine   | 2          | 7    | 7      | 2   |       |       | Both       | 2   | 3     |
| Coal Mine   | 3          | 8    | 6      | 3   |       | Y     | Both       | 2   | 4     |
| Coal Mine   | 4          | 10   | 5      | 4   |       | Y     | Both       | 2   | 5     |
| Iron Works  | 1          | 5    | 3      | 3   | Y     |       | Canal only | 1   | 4     |
| Iron Works  | 2          | 7    | 3      | 5   | Y     |       | Both       | 1   | 4     |
| Iron Works  | 3          | 9    | 2      | 7   | Y     |       | Both       | 1   | 5     |
| Iron Works  | 4          | 12   | 1      | 9   | Y     |       | Both       | 1   | 6     |
| Shipyard    | 0          |      |        |     |       |       | Dev action | 2   |       |
| Shipyard    | 1          | 16   | 2      | 10  | Y     | Y     | Canal only | 2   |       |
| Shipyard    | 2          | 25   | 1      | 18  | Y     | Y     | Rail only  | 2   |       |

## Connections

- Your network: locations holding one of your own counters, or at either end of one of your own
  links. Other players' counters and links never count.
- Same location: two counters in the same location are connected, whoever owns them. No link is
  needed.
- Connected: two locations joined by a route of anyone's links.
- Market access: every port counter (flipped or not) and some external locations show the market
  trade icon. Being connected to one gives access to DT for coal and to the Distant Market.

## Actions

### Build industry

1. A Location card shows where to build, OR an Industry card builds anywhere in your network (OR
   use 2 actions, discard any 2 cards, build anywhere). First build: an
   Industry card can build anywhere matching the symbol.
2. Requires coal? If available in L via anyone's links, take the nearest; else from DT (or supply)
   via anyone's links and a port counter or external location.
3. Requires iron? Take from anywhere in L (no connections needed); else pay from DT (or supply).
4. Canal Period: each player builds only once in a location.
5. Replacements: must be the same type, with a higher tech level. You can replace your own anytime
   (remove the cubes). You can only replace other players' coal and iron mines, and only if there
   are none of the respective cubes in L or on DT.
6. Coal or Iron Mine: when building, sell to DT first and get the cash. (Coal must be connected via
   anyone's links to anyone's port counter or an external location.)

### Build canal or rail link

Discard any card. The link must touch your network. 1 link per location.

- Canal: £3.
- Rail: £5 plus 1 coal from either end (moved to that end via anyone's connections, as per the
  Build industry coal movement rules).
- 2 rails: £15 plus 1 coal from either end (as above) for each rail. The two rails do not have to
  be together.

### Development

Discard any card. Discard 1 or 2 counters from the stacks (same or different). Remove 1 iron for
each counter discarded (first from anywhere in L, then from DT).

### Take loan

Not allowed once the deck is exhausted in the Rail Period. Discard any card. Get £10, £20 or £30.
Go down 1, 2 or 3 income bands.

### Sell cotton

Discard any card. Sell from any or all face-up Mills, in any order. Each Mill in turn travels to
either:

- a face-up port counter (anyone's, not necessarily the nearest) via anyone's links: flip both,
  gain income; OR
- the Distant Market (only if CD has not bottomed out) through any port counter or external
  location (via anyone's links): flip the stack, move CD down, then:
  - if the bottom is not reached: flip the Mill, gain income from the Mill counter plus the Cotton
    Demand track;
  - if the bottom is reached: no flip, no income, no further sales, and the Sell cotton action
    stops immediately.

## Birkenhead

A shipyard can only be built if a rail link brings coal in. The virtual link between Birkenhead
and Liverpool acts ONLY like a canal or rail link for using an Industry card to build. This link
can never be used to move coal or sell cotton.

## End of the Canal Period

1. Link VPs: count the gold circles at both ends.
2. Counter VPs: the VP number on the hexagon.
3. Remove all canals. Remove all tech level 1 counters from the map, with their cubes (but not
   from your stacks).
4. Make a new Distant Market stack and reset the Cotton Demand marker.
5. Add back the cards discarded at the start of the game and build a new deck. Then remove cards
   again.

## End of the Rail Period

Score link VPs + counter VPs + 1 VP for every £10. Ties: income, then cash in hand, then new player
order.
