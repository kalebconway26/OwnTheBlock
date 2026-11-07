/** Photo credits. All photos are openly licensed (via Openverse) and used as demo stand-ins, not real listings. */
export const PHOTO_CREDITS: Record<string, { title: string; creator: string; license: string; source: string }> = {
  "sample-st": { title: "John McAnulty House, Summit Avenue, Summit Hill, Saint Paul, MN", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/51746325685" },
  "sample-st-alt": { title: "C. Scott Chambers House and Funeral Parlor, Main Street, Walton, KY", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/52718651732" },
  "example-ave": { title: "Duplex in Seattle's West Woodland neighborhood", creator: "Sightline Institute", license: "CC BY 2.0", source: "https://www.flickr.com/photos/167460542@N02/51301861494" },
  "demo-ct": { title: "Boarded up houses on North Huron Street", creator: "chris.rycroft", license: "CC BY 2.0", source: "https://www.flickr.com/photos/193316968@N06/53867788710" },
  "corner-cuts": { title: "Barbershop", creator: "billackerman1", license: "CC BY 2.0", source: "https://www.flickr.com/photos/111803194@N04/51383349251" },
  "corner-cuts-alt": { title: "Jorj Barbershop In Iran", creator: "mostafa meraji", license: "CC0", source: "https://www.flickr.com/photos/142593609@N06/51974918336" },
  "laundromat": { title: "Laundromat geometry", creator: "Lars Plougmann", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/75062596@N00/52178391511" },
  "laundromat-alt": { title: "Laundry Laundromat", creator: "Ryan McGuire", license: "CC0", source: "https://stocksnap.io/photo/laundry-laundromat-4876CF9B9C" },
  "renovation": { title: "House Renovation 051", creator: "shister", license: "CC BY 2.0", source: "https://www.flickr.com/photos/17187321@N00/493713237" },
  "street": { title: "Santamonica Street", creator: "Jay Mantri", license: "CC0", source: "https://stocksnap.io/photo/santamonica-street-EE7CC8DF17" },
  "fund": { title: "Terrace Court, Danville, KY", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/51985527044" },
  "porch": { title: "Terrace Court, Danville, KY", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/51984243722" },
  "bungalow-2": { title: "John McAnulty House, Summit Avenue, Summit Hill, Saint Paul, MN", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/51746325950" },
  "corner-store": { title: "Where the corner store still thrives.", creator: "theslowlane", license: "CC BY 2.0", source: "https://www.flickr.com/photos/90536753@N00/52743772806" },
  "bungalow-3": { title: "Doctor Fenton Adams House, Southern Avenue, Latonia, Covington, KY", creator: "w_lemay", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/59081381@N03/52352791242" },
};

export const photo = (key: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/photos/${key}.jpg`;
