import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useSearchContacts } from "@/hooks/use-shipments";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onPhoneChange: (phone: string) => void;
  type: 'sender' | 'receiver';
  placeholder?: string;
  disabled?: boolean;
}

export function ContactAutocomplete({
  value,
  onValueChange,
  onPhoneChange,
  type,
  placeholder,
  disabled,
}: ContactAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: contacts, isLoading } = useSearchContacts(
    searchQuery || value,
    type,
    open && (searchQuery.length >= 2 || value.length >= 2)
  );

  const handleSelect = (contact: { name: string; phone: string }) => {
    // Remplir les champs
    onValueChange(contact.name);
    onPhoneChange(contact.phone);
    
    // Fermer immédiatement le popover et réinitialiser
    setOpen(false);
    setSearchQuery("");
    
    // Remettre le focus sur le champ input après sélection
    setTimeout(() => {
      inputRef.current?.focus();
      // Optionnel: mettre le curseur à la fin du texte
      if (inputRef.current) {
        inputRef.current.setSelectionRange(
          contact.name.length,
          contact.name.length
        );
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);
    setSearchQuery(newValue);
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (value.length >= 2) {
      setSearchQuery(value);
      setOpen(true);
    }
  };

  // Fermer le popover si l'utilisateur clique en dehors
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => {
          // Empêcher le focus automatique sur le contenu du popover
          e.preventDefault();
        }}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>
              {language === "fr"
                ? "Aucun contact trouvé"
                : "No contacts found"}
            </CommandEmpty>
            {contacts && contacts.length > 0 && (
              <CommandGroup>
                {contacts.map((contact, index) => (
                  <CommandItem
                    key={`${contact.name}-${contact.phone}-${index}`}
                    value={contact.name}
                    onSelect={(currentValue) => {
                      // Vérifier que la valeur correspond bien au contact sélectionné
                      if (currentValue === contact.name) {
                        handleSelect(contact);
                      }
                    }}
                    onMouseDown={(e) => {
                      // Empêcher la perte de focus sur l'input et garantir la sélection
                      e.preventDefault();
                      handleSelect(contact);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col w-full">
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {contact.phone}
                        {contact.count > 1 && (
                          <span className="ml-2">
                            ({contact.count}{" "}
                            {language === "fr" ? "fois" : "times"})
                          </span>
                        )}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
