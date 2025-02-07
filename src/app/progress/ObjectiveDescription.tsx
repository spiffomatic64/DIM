import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { DestinyObjectiveDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';

export default function ObjectiveDescription({
  progressDescription,
  objectiveDef,
}: {
  progressDescription: string;
  objectiveDef?: DestinyObjectiveDefinition;
}) {
  return (
    <div className="objective-description">
      {objectiveDef?.displayProperties.hasIcon && (
        <BungieImage src={objectiveDef.displayProperties.icon} />
      )}
      <RichDestinyText text={progressDescription} />
    </div>
  );
}
