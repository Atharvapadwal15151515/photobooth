import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getBoothByInviteToken } from "../api/api";

function InvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();

  const [booth, setBooth] = useState(null);
  const [recipientParticipantId, setRecipientParticipantId] =
    useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const getParticipantRole = (participant) => {
    return String(
      participant?.role ??
        participant?.participant_role ??
        participant?.participantRole ??
        participant?.participant_type ??
        participant?.participantType ??
        participant?.type ??
        ""
    )
      .trim()
      .toLowerCase();
  };

  const getParticipantId = (participant) => {
    return (
      participant?.participant_id ??
      participant?.participantId ??
      participant?.id ??
      null
    );
  };

  useEffect(() => {
    const loadInvitation = async () => {
      if (!inviteToken) {
        setError("The invitation token is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response =
          await getBoothByInviteToken(inviteToken);

        console.log(
          "INVITATION RESPONSE:",
          JSON.stringify(response?.data, null, 2)
        );

        const responseBody =
          response?.data ?? response ?? {};

        const payload =
          responseBody?.data ?? responseBody ?? {};

        const boothData =
          payload?.booth ??
          payload?.boothData ??
          responseBody?.booth ??
          payload;

        const participants = [
          payload?.participants,
          boothData?.participants,
          responseBody?.participants,
        ].find((value) => Array.isArray(value)) ?? [];

        const recipientFromArray = participants.find(
          (participant) =>
            getParticipantRole(participant) === "recipient"
        );

        const recipientParticipant =
          payload?.recipientParticipant ??
          payload?.recipient_participant ??
          payload?.recipient ??
          boothData?.recipientParticipant ??
          boothData?.recipient_participant ??
          boothData?.recipient ??
          responseBody?.recipientParticipant ??
          responseBody?.recipient_participant ??
          responseBody?.recipient ??
          recipientFromArray ??
          null;

        const boothId =
          boothData?.booth_id ??
          boothData?.boothId ??
          boothData?.id ??
          payload?.booth_id ??
          payload?.boothId ??
          null;

        const recipientId =
          getParticipantId(recipientParticipant) ??
          payload?.recipient_participant_id ??
          payload?.recipientParticipantId ??
          boothData?.recipient_participant_id ??
          boothData?.recipientParticipantId ??
          responseBody?.recipient_participant_id ??
          responseBody?.recipientParticipantId ??
          null;

        console.log("PARSED INVITATION BOOTH:", boothData);
        console.log("INVITATION PARTICIPANTS:", participants);
        console.log(
          "RECIPIENT PARTICIPANT:",
          recipientParticipant
        );
        console.log("RECIPIENT ID:", recipientId);

        if (!boothId) {
          throw new Error(
            "The booth information was not returned."
          );
        }

        if (!recipientId) {
          throw new Error(
            "Recipient participant information was not returned by the server."
          );
        }

        setBooth({
          ...boothData,
          boothId,
        });

        setRecipientParticipantId(recipientId);
      } catch (requestError) {
        console.error(
          "Load invitation error:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ??
            requestError?.response?.data?.error ??
            requestError?.message ??
            "Unable to load this invitation."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [inviteToken]);

  const handleAcceptInvitation = () => {
    const boothId =
      booth?.boothId ??
      booth?.booth_id ??
      booth?.id;

    if (!boothId || !recipientParticipantId) {
      setError("Recipient information is missing.");
      return;
    }

    navigate(
      `/booth/${boothId}/recipient/${recipientParticipantId}`
    );
  };

  if (isLoading) {
    return (
      <main className="page-container">
        <section className="status-card">
          <h1>Loading invitation...</h1>

          <p>Please wait while we retrieve the photo booth.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-container">
        <section className="status-card error-card">
          <h1>Invitation unavailable</h1>

          <p>{error}</p>
        </section>
      </main>
    );
  }

  const creatorName =
    booth?.creator_name ??
    booth?.creatorName ??
    "Someone";

  const recipientName =
    booth?.recipient_name ??
    booth?.recipientName ??
    "Friend";

  const title =
    booth?.title ??
    "You have received a photo booth invitation";

  const message =
    booth?.message ??
    "Take your photos to complete this shared memory.";

  const photoCount = Number(
    booth?.photo_count ??
      booth?.photoCount ??
      4
  );

  return (
    <main className="page-container">
      <section className="invitation-card">
        <div className="invitation-badge">
          Photo booth invitation
        </div>

        <h1>{title}</h1>

        <p className="invitation-greeting">
          Hi {recipientName},
        </p>

        <p>
          <strong>{creatorName}</strong> has invited you to
          complete a shared photo booth.
        </p>

        <blockquote>{message}</blockquote>

        <div className="invitation-details">
          <span>
            You will take {photoCount} photo
            {photoCount === 1 ? "" : "s"}.
          </span>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAcceptInvitation}
        >
          Open camera
        </button>
      </section>
    </main>
  );
}

export default InvitePage;