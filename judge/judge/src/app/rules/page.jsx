import styles from "./page.module.css"

export default function RulesPage() {
  return (
    <div className={styles.rulescontainer}>
    <article className="prose max-w-3xl mx-auto p-6">
      <h1>The Judge – Rules</h1>

      <section>
        <h2>1. Introduction and Theme</h2>
        <p>An innocent person is standing trial for murder!!! Some lawyers are trying to prove the innocence of the person, while others being bought by the true Culprit want to frame the person. Could you, being the qualified lawyer you are, sucesfully sway the Judge.</p>
      </section>

      <section>
        <h2>2. Game Objective</h2>
        <p>
          The honest team wins when there are <strong>5 honest (blue)</strong> pieces of evidence
          presented. The corrupt team wins when there are <strong>5 corrupt (red)</strong> pieces of evidence
          presented.
        </p>
      </section>

      <section>
        <h2>3. Components</h2>
        <ul>
          <li>Roles (assigned automatically)</li>
          <li>Evidence deck: 16 red and 9 blue</li>
          <li>
            Game chat: notifies users real-time if a move has been made
          </li>
          <li>Evidence boards</li>
        </ul>
      </section>

      <section>
        <h2>4. Role Chart</h2>
        <table>
          <thead>
            <tr>
              <th>Player Count</th>
              <th>Honest Team</th>
              <th>Corrupt Team</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>6</td><td>Judge + 3</td><td>2</td></tr>
            <tr><td>7</td><td>Judge + 3</td><td>3</td></tr>
            <tr><td>8</td><td>Judge + 4</td><td>3</td></tr>
            <tr><td>9</td><td>Judge + 4</td><td>4</td></tr>
            <tr><td>10</td><td>Judge + 5</td><td>4</td></tr>
            <tr><td>11</td><td>Judge + 5</td><td>5</td></tr>
            <tr><td>12</td><td>Judge + 6</td><td>5</td></tr>
            <tr><td>13</td><td>Judge + 6</td><td>6</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Core Gameplay</h2>
        <p>
          Some rules vary by player count (see sections 6 and 7), but the following core gameplay
          applies to all player counts. The Judge and the honest team attempt to build firms that
          present honest evidence. Each evidence phase repeats these steps until a team wins with 5
          matching evidence cards:
        </p>
        <ol>
          <li>The Judge selects a Partner by handing them the Partner token.</li>
          <li>The Partner selects an Associate.</li>
          <li>The Associate selects a Paralegal.</li>
          <li>
            The Associate and Paralegal each draw 3 evidence cards, discard 1, and pass 2 facedown to
            the Partner. (If fewer than 3 remain in the draw stack, shuffle the discard back in.)
          </li>
          <li>
            The Partner shuffles the 4 received cards, discards 1, then presents 3 to the Judge.
            <br />
            One card matching the majority color is placed on the Evidence Board; the other two are
            discarded.
          </li>
          <li>
            Judge or players enact any evidence bonuses listed on the Evidence Board for the new
            card.
          </li>
          <li>Begin the next evidence phase. Continue until 5 evidence of one color are played.</li>
        </ol>
      </section>

      <section>
  <h2>6. Team Locks</h2>
  <p>Team lock rules restrict who can be on consecutive teams:</p>
  <ul>
    <li>No player may hold the same role in two consecutive phases.</li>
  </ul>
  <h3>Additional Team Lock Rules by Player Count</h3>
  <table>
    <thead>
      <tr>
        <th>Player Count</th>
        <th>Rule</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>6–7</td><td>No additional restrictions</td></tr>
      <tr><td>8–9</td><td>Max 2 overlapping players from previous team</td></tr>
      <tr><td>10–11</td><td>Max 1 overlapping player from previous team</td></tr>
      <tr><td>12–13</td><td>No overlapping players allowed</td></tr>
    </tbody>
  </table>
</section>
      <section>
        <h2>7. Evidence Powers</h2>
        <p>
          Playing evidence on certain board spaces unlocks powers, denoted by symbols:
        </p>
        <ul>
          <li>
            <strong>Draw Two and Discard Up to One</strong> (all counts): Judge assigns Power token to
            a player. That player draws 2, discards up to 1, and puts the rest back on top of the
            deck.
          </li>
          <li>
            <strong>Investigate</strong> (6–13): Judge assigns Power token. That player views any
            other player’s role card.
          </li>
          <li>
            <strong>Reverse Investigate</strong> (11–13): Judge assigns Power token. That player
            reveals their own role to another player.
          </li>
          <li>
            <strong>Reject Corrupt Evidence</strong> (all counts): After 4 corrupt evidence are
            placed, if all team members agree, discard that phase and restart with new team.
          </li>
          <li>
            <strong>Reject Honest Evidence</strong> (all counts): After 4 corrupt evidence are
            placed, if all team members agree, the corrupt team automatically wins.
          </li>
        </ul>
      </section>
    </article>
    </div>
  );
}
